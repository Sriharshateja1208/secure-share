// server/src/services/ChallengeEngine.ts
import crypto from 'crypto';

interface UserKYC {
    fullname: string;
    dob: Date;
    pan: string;
    aadhaar: string;
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

        // question = "To unlock the file, please enter " + ", followed by ".join(sentence_parts) + "."
        const questionText = "To unlock the file, please enter " + ruleParts.join(", followed by ") + ".";

        // answer = "".join(answer_parts)
        const answer = answerParts.join("");

        return {
            questionText,
            answer // Note: Controller should hash this immediately and not store it raw
        };
    }

    // Helper to generate HMAC for the answer (SHA-256)
    static computeAnswerHmac(answer: string, nonce: string): string {
        return crypto.createHmac('sha256', process.env.CHALLENGE_SECRET || 'secret')
            .update(answer.toLowerCase() + nonce) // normalization
            .digest('hex');
    }
}
