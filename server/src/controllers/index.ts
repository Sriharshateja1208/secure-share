import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { FileService } from '../services/FileService';
import { ChallengeEngine } from '../services/ChallengeEngine';
import { AuditService } from '../services/AuditService';
import { EmailService } from '../services/EmailService';
import { OtpService } from '../services/OtpService';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Verify credentials first
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new Error('Invalid credentials');
            }

            const ip = req.ip || req.socket.remoteAddress || 'unknown';

            // Check if user is admin (you can define admin by email or add an 'isAdmin' field)
            const adminEmail = (process.env.ADMIN_EMAIL || 'admin@secure.com').toLowerCase();
            const isAdmin = email.toLowerCase() === adminEmail;

            if (isAdmin) {
                // Admin bypass: issue JWT immediately
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    process.env.JWT_SECRET || 'secret',
                    { expiresIn: '24h' }
                );

                await AuditService.log(user.id, 'LOGIN', true, { ip, method: 'admin_direct' });

                return res.json({
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        fullname: user.fullname
                    }
                });
            }

            // Non-admin: Generate and send OTP
            const otp = OtpService.generateOtp(user.id);
            const emailSent = await EmailService.sendOtpEmail(email, otp, user.fullname);

            if (emailSent) {
                await AuditService.log(user.id, 'OTP_SENT', true, { ip });
                return res.json({
                    requiresOtp: true,
                    userId: user.id,
                    message: 'OTP sent to your email'
                });
            }

            await AuditService.log(user.id, 'OTP_SENT', false, { ip, reason: 'email_failed' });

            // ALWAYS return OTP in response if email fails, to allow login in dev/demo environments without SMTP
            console.log(`[DEBUG] OTP for ${email}: ${otp}`);
            return res.json({
                requiresOtp: true,
                userId: user.id,
                otp, // Expose OTP for testing/demo
                message: 'OTP generated (Email failed - check console/network)'
            });
        } catch (err: any) {
            console.error('[ERROR] Login failed', err.message);
            await AuditService.log('unknown', 'LOGIN', false, { ip: req.ip || 'unknown' });
            res.status(401).json({ error: err.message });
        }
    }

    static async verifyOtp(req: Request, res: Response) {
        try {
            const { userId, otp } = req.body;

            if (!userId || !otp) {
                throw new Error('User ID and OTP are required');
            }

            const parsedOtp = parseInt(otp, 10);
            if (Number.isNaN(parsedOtp)) {
                throw new Error('OTP must be a 6-digit number');
            }

            const isValid = OtpService.verifyOtp(userId, parsedOtp);

            if (!isValid) {
                await AuditService.log(userId, 'OTP_VERIFY', false, { ip: req.ip });
                throw new Error('Invalid or expired OTP');
            }

            // OTP verified, issue JWT
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            await AuditService.log(userId, 'LOGIN', true, { ip: req.ip, method: 'otp' });

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname
                }
            });
        } catch (err: any) {
            console.error('[ERROR] OTP verification failed', err.message);
            res.status(401).json({ error: err.message });
        }
    }

    static async register(req: Request, res: Response) {
        try {
            const result = await AuthService.register(req.body);
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            await AuditService.log(result.user.id, 'REGISTER', true, { ip });
            res.json(result);
        } catch (err: any) {
            console.error('[ERROR] Register failed', err.message);
            await AuditService.log('unknown', 'REGISTER', false, { ip: req.ip || 'unknown', error: err.message });
            res.status(400).json({ error: err.message });
        }
    }

    static async setup(req: Request, res: Response) {
        const data = await AuthService.generateTotpQr();
        res.json(data);
    }
}

export class FileController {
    static async upload(req: Request, res: Response) {
        try {
            console.log('[DEBUG] FileController.upload called');
            console.log('[DEBUG] req.file:', req.file);
            console.log('[DEBUG] req.body:', req.body);
            console.log('[DEBUG] User:', (req as any).user);

            if (!req.file) {
                console.error('[ERROR] No file in request');
                throw new Error('No file uploaded');
            }
            const userId = (req as any).user?.userId;

            if (!userId) {
                console.error('[ERROR] No user ID in request');
                throw new Error('User ID not found');
            }

            // @ts-ignore
            console.log('[DEBUG] Calling FileService.uploadFile');
            const result = await FileService.uploadFile(req.file, req.file.originalname, userId);
            console.log('[DEBUG] Upload success:', result);
            res.json(result);
        } catch (err: any) {
            console.error('[ERROR] Upload error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }

    static async createShare(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const userId = user?.userId;

            if (!userId) throw new Error('User ID not found in request');

            // Find sender details for email
            const sender = await prisma.user.findUnique({ where: { id: userId } });
            if (!sender) throw new Error('Sender not found');

            const { fileId, targetEmail } = req.body;

            if (!targetEmail) throw new Error('Target email is required for enterprise sharing');

            // Verify Ownership: Check if the file exists and is owned by the requester
            const file = await prisma.fileRecord.findUnique({ where: { id: fileId } });
            if (!file || file.ownerId !== userId) {
                throw new Error('You do not have permission to share this file');
            }

            // Find target user by email
            const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
            if (!targetUser) {
                throw new Error(`The email address '${targetEmail}' is not registered with SecureShare. Users must have an account to receive shared files.`);
            }

            const shareToken = crypto.randomBytes(16).toString('hex');

            const share = await prisma.share.create({
                data: {
                    file: { connect: { id: fileId } },
                    target_user: { connect: { id: targetUser.id } },
                    share_token: shareToken,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                },
                include: { file: true }
            });

            // Send Email Notification
            const shareLink = `http://localhost:5173/s/${shareToken}`;
            // @ts-ignore
            await EmailService.sendShareLink(targetEmail, shareLink, sender.fullname, share.file.filename);

            await AuditService.log(userId, 'SHARE_CREATED', true, { fileId, targetEmail, shareId: share.id });

            res.json({ shareToken, shareId: share.id, message: `Share link sent to ${targetEmail}` });
        } catch (err: any) {
            // @ts-ignore
            await AuditService.log((req as any).user?.userId || 'unknown', 'SHARE_CREATED', false, { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }

    static async downloadWithToken(req: Request, res: Response) {
        try {
            const tokenParam = req.params.token;
            const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
            if (!token) throw new Error('Token is required');

            const downloadToken = await prisma.downloadToken.findUnique({ where: { token } });
            if (!downloadToken) throw new Error('Invalid token');
            if (downloadToken.used) throw new Error('Token already used');
            if (downloadToken.expires_at < new Date()) throw new Error('Token expired');

            await prisma.downloadToken.update({
                where: { token },
                data: { used: true }
            });

            await AuditService.log(downloadToken.user_id, 'DOWNLOAD', true, { shareId: downloadToken.share_id, ip: req.ip });

            const share = downloadToken.share_id
                ? await prisma.share.findUnique({ where: { id: downloadToken.share_id } })
                : null;
            if (!share) throw new Error('Share not found for token');

            // @ts-ignore
            const fileData = await FileService.downloadFile(share.file_id);
            const { buffer, filename } = fileData as any;

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(buffer);
        } catch (err: any) {
            await AuditService.log('unknown', 'DOWNLOAD', false, { ip: req.ip, details: err.message });
            res.status(403).json({ error: err.message });
        }
    }

    static async listFiles(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new Error('User ID not found');

            const files = await prisma.fileRecord.findMany({
                where: { ownerId: userId },
                orderBy: { createdAt: 'desc' },
                select: { id: true, filename: true, createdAt: true }
            });
            res.json(files);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async listSharedFiles(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) throw new Error('User ID not found');

            const shares = await prisma.share.findMany({
                where: { target_user_id: userId },
                include: {
                    file: {
                        select: { filename: true, owner: { select: { fullname: true, email: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedShares = shares.map(share => ({
                shareId: share.id,
                fileId: share.file_id,
                filename: share.file.filename,
                sender: share.file.owner.fullname,
                senderEmail: share.file.owner.email,
                sharedAt: share.createdAt,
                shareToken: share.share_token
            }));

            res.json(formattedShares);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}

export class ChallengeController {
    static async getChallenge(req: Request, res: Response) {
        try {
            const tokenParam = req.params.token;
            const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
            if (!token) throw new Error('Token is required');

            const share = await prisma.share.findUnique({
                where: { share_token: token }
            });

            if (!share) throw new Error('Share not found');
            if (share.expires_at < new Date()) throw new Error('Share expired');
            // @ts-ignore
            if (share.attempts_remaining <= 0) throw new Error('Max attempts exceeded. Access locked.');

            const targetUser = await prisma.user.findUnique({ where: { id: share.target_user_id } });
            if (!targetUser) throw new Error('Target user not found');

            const kycData = {
                fullname: targetUser.fullname,
                surname: targetUser.surname,
                dob: targetUser.dob,
                pan: targetUser.pan,
                aadhaar: targetUser.aadhaar,
                personal_q1: (targetUser as any).personal_q1,
                personal_a1: (targetUser as any).personal_a1,
                personal_q2: (targetUser as any).personal_q2,
                personal_a2: (targetUser as any).personal_a2,
                formula_op: (targetUser as any).formula_op || 'shift',
                formula_num: (targetUser as any).formula_num || 3
            };

            // @ts-ignore
            const challengeData = ChallengeEngine.generateDynamicRule(kycData);
            const nonce = crypto.randomBytes(8).toString('hex');
            const hmac = ChallengeEngine.computeAnswerHmac(challengeData.answer, nonce);

            const challenge = await prisma.challenge.create({
                data: {
                    share_id: share.id,
                    question_text: challengeData.questionText,
                    nonce: nonce,
                    answer_hmac: hmac,
                    fingerprint: crypto.randomBytes(4).toString('hex'),
                    status: 'ACTIVE',
                    expires_at: new Date(Date.now() + 120 * 1000) // 120s
                }
            });

            await AuditService.log(share.target_user_id, 'CHALLENGE_Generated', true, { shareId: share.id, challengeId: challenge.id, ip: req.ip });

            res.json({
                challengeId: challenge.id,
                question: challengeData.questionText,
                expiresIn: 120,
                // @ts-ignore
                attemptsRemaining: share.attempts_remaining
            });
        } catch (err: any) {
            res.status(403).json({ error: err.message });
        }
    }

    static async verifyAnswer(req: Request, res: Response) {
        try {
            const { challengeId, answer } = req.body;
            const challenge = await prisma.challenge.findUnique({
                where: { id: challengeId },
                include: { share: true } // Need share to get user
            });

            if (!challenge) throw new Error('Challenge not found');
            if (challenge.status !== 'ACTIVE') throw new Error('Challenge not active');
            if (challenge.expires_at < new Date()) {
                await prisma.challenge.update({ where: { id: challengeId }, data: { status: 'INVALID' } });
                throw new Error('Challenge expired');
            }

            const calcHmac = ChallengeEngine.computeAnswerHmac(answer.trim(), challenge.nonce);

            if (calcHmac !== challenge.answer_hmac) {
                // Decrement attempts
                const updatedShare = await prisma.share.update({
                    where: { id: challenge.share_id },
                    // @ts-ignore
                    data: { attempts_remaining: { decrement: 1 } }
                });

                await prisma.challenge.update({ where: { id: challengeId }, data: { status: 'INVALID' } });
                // @ts-ignore
                await AuditService.log(challenge.share.target_user_id, 'CHALLENGE_VERIFY', false, { challengeId, ip: req.ip, attemptsLeft: updatedShare.attempts_remaining });

                // @ts-ignore
                if (updatedShare.attempts_remaining <= 0) {
                    throw new Error('Max attempts exceeded. Access locked.');
                }

                // @ts-ignore
                throw new Error(`Incorrect answer. Attempts remaining: ${updatedShare.attempts_remaining}`);
            }

            await prisma.challenge.update({ where: { id: challengeId }, data: { status: 'USED' } });

            const token = crypto.randomBytes(32).toString('hex');
            await prisma.downloadToken.create({
                data: {
                    token,
                    share_id: challenge.share_id,
                    user_id: challenge.share.target_user_id,
                    expires_at: new Date(Date.now() + 60 * 60 * 1000),
                }
            });

            await AuditService.log(challenge.share.target_user_id, 'CHALLENGE_VERIFY', true, { challengeId, ip: req.ip });

            res.json({ downloadToken: token });

        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
