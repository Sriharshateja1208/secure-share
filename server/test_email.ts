import { EmailService } from './src/services/EmailService';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('--- SMTP TEST ---');
    console.log('User:', process.env.SMTP_USER);
    // console.log('Pass:', process.env.SMTP_PASS); // Security: don't log pass

    const success = await EmailService.sendShareLink(
        process.env.SMTP_USER || '',
        'http://localhost:5173/test-link',
        'Test Admin',
        'VerificationTest.pdf'
    );

    if (success) {
        console.log('SUCCESS: Email sent successfully!');
    } else {
        console.log('FAILED: Check error logs above.');
    }
}

test().catch(console.error);
