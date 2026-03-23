import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@secure.com';

async function cleanup() {
    console.log(`[CLEANUP] Keeping user: ${ADMIN_EMAIL}`);

    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!admin) {
        console.log('[WARNING] Admin user not found! Aborting to prevent total data loss.');
        return;
    }

    console.log(`[CLEANUP] Admin ID: ${admin.id}`);

    // 1. Delete all AccessLogs (for simplicity, or filter by user)
    // Deleting all is safer to avoid foreign key constraints if we miss something, 
    // but let's try to be specific: Logs where user_id != admin.id
    const deleteLogs = await prisma.accessLog.deleteMany({
        where: { user_id: { not: admin.id } }
    });
    console.log(`[CLEANUP] Deleted ${deleteLogs.count} AccessLogs`);

    // 2. Delete all DownloadTokens (linked to Share or User)
    // Tokens linked to non-admin user
    const deleteTokens = await prisma.downloadToken.deleteMany({
        where: { user_id: { not: admin.id } }
    });
    console.log(`[CLEANUP] Deleted ${deleteTokens.count} DownloadTokens`);

    // 3. Delete Challenges (linked to Shares)
    // We need to find shares that will be deleted first.
    // Shares where target_user != admin OR file.owner != admin (if we delete files)

    // Easier approach: Delete everything related to non-admin users.

    // Find all users to delete
    const usersToDelete = await prisma.user.findMany({
        where: { id: { not: admin.id } },
        select: { id: true }
    });
    const userIds = usersToDelete.map(u => u.id);
    console.log(`[CLEANUP] Found ${userIds.length} users to delete.`);

    if (userIds.length === 0) {
        console.log('[CLEANUP] No other users to delete.');
        return;
    }

    // Delete Shares received BY these users
    const deleteSharesReceived = await prisma.share.deleteMany({
        where: { target_user_id: { in: userIds } }
    });
    console.log(`[CLEANUP] Deleted ${deleteSharesReceived.count} Shares (Received)`);

    // Find Files owned by these users
    const filesToDelete = await prisma.fileRecord.findMany({
        where: { ownerId: { in: userIds } },
        select: { id: true }
    });
    const fileIds = filesToDelete.map(f => f.id);

    // Delete Shares OF these files (even if sent to admin)
    const deleteSharesOfFiles = await prisma.share.deleteMany({
        where: { file_id: { in: fileIds } }
    });
    console.log(`[CLEANUP] Deleted ${deleteSharesOfFiles.count} Shares (of deleted files)`);

    // Delete Challenges linked to deleted shares?
    // Prisma might need explicit delete if no cascade. 
    // Let's delete all orphaned challenges or just delete all challenges to be clean if they are not critical?
    // Challenges are linked to Shares. If we deleted Shares, we might have issues if Cascade isn't on.
    // Let's delete ALL challenges to be safe, or find orphan ones. 
    // Schema: Challenge -> Share. 
    // Let's just delete ALL challenges for now to clear state.
    const deleteChallenges = await prisma.challenge.deleteMany({});
    console.log(`[CLEANUP] Deleted ${deleteChallenges.count} Challenges`);

    // Now safe to delete Files
    const deleteFiles = await prisma.fileRecord.deleteMany({
        where: { id: { in: fileIds } }
    });
    console.log(`[CLEANUP] Deleted ${deleteFiles.count} Files`);

    // Finally delete Users
    const deleteUsers = await prisma.user.deleteMany({
        where: { id: { in: userIds } }
    });
    console.log(`[CLEANUP] Deleted ${deleteUsers.count} Users`);
}

cleanup()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
