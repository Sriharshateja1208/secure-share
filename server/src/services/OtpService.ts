interface OtpRecord {
    otp: number;
    expiry: number;
}

class OtpServiceClass {
    private otpStore: Map<string, OtpRecord> = new Map();

    generateOtp(userId: string): number {
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
        const expiry = Date.now() + 2 * 60 * 1000; // 2 minutes from now

        this.otpStore.set(userId, { otp, expiry });

        // Auto-cleanup expired OTP after 2 minutes
        setTimeout(() => {
            this.otpStore.delete(userId);
        }, 2 * 60 * 1000);

        return otp;
    }

    verifyOtp(userId: string, userOtp: number): boolean {
        const record = this.otpStore.get(userId);

        if (!record) {
            return false; // No OTP found for this user
        }

        if (Date.now() > record.expiry) {
            this.otpStore.delete(userId);
            return false; // OTP expired
        }

        if (record.otp !== userOtp) {
            return false; // OTP mismatch
        }

        // OTP is valid, delete it (one-time use)
        this.otpStore.delete(userId);
        return true;
    }

    // For testing/debugging
    hasOtp(userId: string): boolean {
        return this.otpStore.has(userId);
    }
}

export const OtpService = new OtpServiceClass();
