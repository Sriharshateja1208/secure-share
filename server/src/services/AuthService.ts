import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// @ts-ignore
import { authenticator } from 'otplib';
// @ts-ignore
import qrcode from 'qrcode';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const TOTP_SECRET = process.env.TOTP_SECRET || 'base32secret3232';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@secure.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

export class AuthService {
    // Initialize default admin if not exists (for demo)
    static async initAdmin() {
        const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await prisma.user.create({
                data: {
                    email: ADMIN_EMAIL,
                    fullname: 'Admin User',
                    surname: 'User',
                    dob: new Date('1990-01-01'),
                    pan: 'ABCDE1234F',
                    aadhaar: '123456789012',
                    password: hashedPassword,
                    totp_secret: '', // Unused
                },
            });
            console.log(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
        }
    }

    static async register(data: any) {
        const { email, password, fullname, surname, dob, pan, aadhaar } = data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                fullname,
                surname,
                dob: new Date(dob),
                pan,
                aadhaar,
                password: hashedPassword,
                totp_secret: '',
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        // @ts-ignore
        return { token, user: { id: user.id, name: user.fullname, email: user.email } };
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        // @ts-ignore
        return { token, user: { id: user.id, name: user.fullname, email: user.email } };
    }

    static async generateTotpQr() {
        return { secret: '', qr: '' };
    }
}
