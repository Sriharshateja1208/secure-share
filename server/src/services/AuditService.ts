import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
    static async log(
        userId: string,
        action: string,
        success: boolean,
        details?: { shareId?: string; challengeId?: string; ip?: string;[key: string]: any }
    ) {
        try {
            await prisma.accessLog.create({
                data: {
                    user_id: userId,
                    action,
                    success,
                    share_id: details?.shareId,
                    challenge_id: details?.challengeId,
                    ip: details?.ip || 'unknown',
                },
            });
            console.log(`[AUDIT] ${action} by ${userId} - Success: ${success}`);
        } catch (error) {
            console.error('[AUDIT_FAIL] Failed to write audit log:', error);
        }
    }
}
