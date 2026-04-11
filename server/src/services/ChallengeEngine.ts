// server/src/services/ChallengeEngine.ts
import crypto from 'crypto';

interface UserKYC {
    fullname: string;
    surname?: string;
    dob: Date;
    pan: string;
    aadhaar: string;
    personal_q1?: string | null;
    personal_a1?: string | null;
    personal_q2?: string | null;
    personal_a2?: string | null;
    formula_op?: string;
    formula_num?: number;
}

export class ChallengeEngine {
    static generateDynamicRule(profile: UserKYC) {
        // Unpack profile
        const name = profile.fullname.replace(/\s/g, "");
        const dobISO = profile.dob.toISOString().split('T')[0]; // YYYY-MM-DD
        const [dobYear, dobMonth, dobDay] = dobISO.split('-');

        const pan = profile.pan;
        const aadhaar = profile.aadhaar;

        const fields: { [key: string]: string } = {
            "full name": name,
            "PAN number": pan,
            "Aadhaar number": aadhaar,
            "birth year": dobYear,
            "birth month": dobMonth,
            "birth day": dobDay
        };

        if (profile.surname) {
            fields["surname"] = profile.surname;
        }

        if (profile.personal_q1 && profile.personal_a1) {
            fields[`answer to '${profile.personal_q1}'`] = profile.personal_a1;
        }
        if (profile.personal_q2 && profile.personal_a2) {
            fields[`answer to '${profile.personal_q2}'`] = profile.personal_a2;
        }

        const ruleParts: string[] = [];
        const answerParts: string[] = [];
        const numParts = 3; // Default parts

        const fieldKeys = Object.keys(fields);

        for (let i = 0; i < numParts; i++) {
            // secrets.choice equivalent
            const fieldName = fieldKeys[Math.floor(Math.random() * fieldKeys.length)];
            const fieldValue = fields[fieldName];

            let partDesc = "";
            let partValue = "";

            if (fieldValue.length > 3) {
                // start = secrets.randbelow(len(field_value) - 2)
                const start = Math.floor(Math.random() * (fieldValue.length - 2));

                // length = secrets.randbelow(3) + 2  -> sequence of 2, 3, 4
                const length = Math.floor(Math.random() * 3) + 2;

                // end = min(start + length, len(field_value))
                const end = Math.min(start + length, fieldValue.length);

                // description = f"the characters from position {start+1} to {end} of your {field_name}"
                partDesc = `the characters from position ${start + 1} to ${end} of your ${fieldName}`;

                // value = field_value[start:end]
                partValue = fieldValue.substring(start, end);
            } else {
                partDesc = `your ${fieldName}`;
                partValue = fieldValue;
            }

            ruleParts.push(partDesc);
            answerParts.push(partValue);
        }

        let questionText = "To unlock the file, please enter " + ruleParts.join(", followed by ") + ".";
        
        const rawAnswer = answerParts.join("");
        
        // Apply Secret Formula
        const op = profile.formula_op || 'shift';
        const num = profile.formula_num || 3;
        const transformedAnswer = ChallengeEngine.applyFormula(rawAnswer, op, num);
        
        // Adjust wording if formula is applied
        questionText += ` Finally, apply your Secret Formula.`;

        return {
            questionText,
            answer: transformedAnswer // Note: Controller should hash this immediately and not store it raw
        };
    }

    static applyFormula(str: string, op: string, num: number): string {
        str = str.toLowerCase();
        
        if (op === 'reverse') return str.split('').reverse().join('');
        
        if (op === 'shift') {
            return str.split('').map(c => {
                if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 + num) % 26) + 97);
                if (c >= '0' && c <= '9') return String((parseInt(c) + num) % 10);
                return c;
            }).join('');
        }
        
        if (op === 'sum') {
            const s = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            return String((s + num) % 100).padStart(2, '0');
        }
        
        if (op === 'count') {
            return String(str.length + num);
        }
        
        return str;
    }

    // Helper to generate HMAC for the answer (SHA-256)
    static computeAnswerHmac(answer: string, nonce: string): string {
        return crypto.createHmac('sha256', process.env.CHALLENGE_SECRET || 'secret')
            .update(answer.toLowerCase() + nonce) // normalization
            .digest('hex');
    }
}
