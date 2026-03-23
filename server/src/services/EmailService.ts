import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_cRiyep3X_C2rhJtxonkvjgP33Bb3V8nSR');

export class EmailService {
    static async sendShareLink(email: string, link: string, senderName: string, fileName: string) {
        console.log('[DEBUG] Sending Share Link via Resend');

        try {
            const data = await resend.emails.send({
                from: 'SecureShare Notification <onboarding@resend.dev>',
                to: email, // Must be your verified Resend email address
                subject: `${senderName} shared a secure file with you`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Secure File Sharing</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        Hello,
                    </p>
                    <p style="color: #475569; line-height: 1.6;">
                        <strong>${senderName}</strong> has shared a secure file with you via SecureShare.
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Access Secure File
                        </a>
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">
                     This is an automated notification from SecureShare.
                </p>
            `,
            });
            console.log(`[EMAIL SERVICE] Email sent via Resend:`, data);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending email via Resend:', error);
            return false;
        }
    }

    static async sendOtpEmail(email: string, otp: number, userName: string) {
        console.log('[DEBUG] Sending OTP via Resend');

        try {
            const data = await resend.emails.send({
                from: 'SecureShare Notification <onboarding@resend.dev>',
                to: email, // Must be your verified Resend email address
                subject: 'SecureShare Login OTP',
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-top: 0;">SecureShare Login Verification</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        Hello <strong>${userName}</strong>,
                    </p>
                    <p style="color: #475569; line-height: 1.6;">
                        Your One-Time Password (OTP) for login is:
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 8px;">${otp}</span>
                        </div>
                    </div>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                        This OTP is valid for <strong>2 minutes</strong>. Do not share it with anyone.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">
                        This is an automated notification from SecureShare.
                    </p>
                </div>
            `,
            });
            console.log(`[EMAIL SERVICE] OTP Email sent via Resend:`, data);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending OTP email via Resend:', error);
            return false;
        }
    }
}
