import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
        },
    });

    static async sendShareLink(email: string, link: string, senderName: string, fileName: string) {
        console.log('[DEBUG] Sending Share Link (Updated Template)');
        // If credentials are not provided, fall back to logging (to avoid crashes)
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('[EMAIL SERVICE] SMTP credentials not found. Logging email instead.');
            console.log(`
            ====================================================
            [EMAIL FALLBACK] To: ${email}
            Subject: ${senderName} shared a secure file with you
            Link: ${link}
            ====================================================
            `);
            return false;
        }

        const mailOptions = {
            from: `"SecureShare Notification" <${process.env.SMTP_USER}>`,
            to: email,
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
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] Email sent: ${info.messageId}`);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending email:', error);
            if (error.response) console.error('[EMAIL SERVICE] SMTP Response:', error.response);
            return false;
        }
    }

    static async sendOtpEmail(email: string, otp: number, userName: string) {
        // Fallback if credentials not provided
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('[EMAIL SERVICE] SMTP credentials not found. Logging OTP instead.');
            console.log(`
            ====================================================
            [OTP EMAIL FALLBACK] To: ${email}
            Subject: SecureShare Login OTP
            OTP: ${otp}
            ====================================================
            `);
            return false;
        }

        const mailOptions = {
            from: `"SecureShare Notification" <${process.env.SMTP_USER}>`,
            to: email,
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
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EMAIL SERVICE] OTP Email sent: ${info.messageId}`);
            return true;
        } catch (error: any) {
            console.error('[EMAIL SERVICE] Error sending OTP email:', error);
            if (error.response) console.error('[EMAIL SERVICE] SMTP Response:', error.response);
            return false;
        }
    }
}
