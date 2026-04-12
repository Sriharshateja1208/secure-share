import nodemailer from 'nodemailer';

export class EmailService {
    static getTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    static async sendShareLink(email: string, link: string, senderName: string, fileName: string) {
        console.log('[DEBUG] Sending Share Link via Nodemailer');

        try {
            const transporter = this.getTransporter();
            const mailOptions = {
                from: `"SecureShare Notification" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `${senderName} shared a secure file with you`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Secure File Sharing</h2>
                    <p style="color: #475569; line-height: 1.6;">Hello,</p>
                    <p style="color: #475569; line-height: 1.6;">
                        <strong>${senderName}</strong> has shared a secure file with you via SecureShare.
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Access Secure File
                        </a>
                    </div>
                </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] Email sent via Nodemailer successfully.`);
            
            // Also explicitly log to console in case email delays
            console.log(`[DEMO BYPASS] Use this Shared Link directly: ${link}`);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending email via Nodemailer:', error);
            // Fallback console log if delivery physically fails
            console.log(`[DEMO BYPASS] Use this Shared Link directly: ${link}`);
            return false;
        }
    }

    static async sendOtpEmail(email: string, otp: number, userName: string) {
        console.log('[DEBUG] Sending OTP via Nodemailer');

        try {
            const transporter = this.getTransporter();
            const mailOptions = {
                from: `"SecureShare Verification" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'SecureShare Login OTP',
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-top: 0;">SecureShare Login Verification</h2>
                    <p style="color: #475569; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6;">Your One-Time Password (OTP) for login is:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <span style="font-size: 32px; font-weight: bold; background-color: #f1f5f9; padding: 20px; border-radius: 8px; letter-spacing: 8px;">${otp}</span>
                    </div>
                </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] OTP Email sent via Nodemailer successfully.`);
            
            // Also explicitly log to console in case email delays
            console.log(`[DEMO BYPASS] Use this OTP directly: ${otp}`);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending OTP email via Nodemailer:', error);
            // Fallback console log
            console.log(`[DEMO BYPASS] Use this OTP directly: ${otp}`);
            return false;
        }
    }
}
