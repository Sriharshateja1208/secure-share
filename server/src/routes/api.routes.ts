import { Router } from 'express';
import multer from 'multer';
import { AuthController, FileController, ChallengeController } from '../controllers';
import jwt from 'jsonwebtoken';

const router = Router();
const upload = multer({ dest: 'temp_uploads/' });

// Middleware to verify JWT
const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Auth
router.post('/auth/setup', AuthController.setup); // Admin setup
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/verify-otp', AuthController.verifyOtp);

// Files (Protected)
router.get('/files', authenticate, FileController.listFiles);
router.get('/files/shared', authenticate, FileController.listSharedFiles);
router.post('/files/upload', authenticate, upload.single('file'), FileController.upload);
router.post('/shares/create', authenticate, FileController.createShare);

// Public Share / Challenge Flow
router.get('/share/:token', ChallengeController.getChallenge); // Step 1: Get Challenge
router.post('/challenge/verify', ChallengeController.verifyAnswer); // Step 2: Verify & Get Token
router.get('/download/:token', FileController.downloadWithToken); // Step 3: Download

export default router;
