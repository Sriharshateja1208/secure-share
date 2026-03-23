import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY_HEX = process.env.ENCRYPTION_KEY || ''; // 32 bytes hex
const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

export class FileService {
    /**
     * Encrypts a file stream, saves to temp, uploads to Cloudinary securely.
     */
    static async uploadFile(file: Express.Multer.File, originalName: string, ownerId: string) {
        console.log('[DEBUG] FileService.uploadFile start');
        if (MASTER_KEY.length !== 32) {
            console.error('[ERROR] Invalid Master Key length:', MASTER_KEY.length);
            throw new Error('Invalid Master Key');
        }

        // 1. Generate DEK (Data Encryption Key)
        const dek = crypto.randomBytes(32);
        const dekIv = crypto.randomBytes(16);

        // 2. Wrap DEK (Encrypt DEK with Master Key)
        const keyCipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, dekIv);
        let wrappedDek = keyCipher.update(dek);
        wrappedDek = Buffer.concat([wrappedDek, keyCipher.final()]);
        const keyTag = keyCipher.getAuthTag();

        // Store wrapped key as: [IV (16)][Tag (16)][Ciphertext]
        const storedWrappedKey = Buffer.concat([dekIv, keyTag, wrappedDek]);

        // 3. Encrypt File with DEK
        const fileIv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, dek, fileIv);

        // Create storage path for local temporal file
        const uploadDir = path.join(__dirname, '../../temp_uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const fileId = crypto.randomUUID();
        const storedFileName = `${fileId}.enc`;
        const filePath = path.join(uploadDir, storedFileName);

        const input = fs.createReadStream(file.path);
        const output = fs.createWriteStream(filePath);

        // Write IV to beginning of file
        output.write(fileIv);

        return new Promise<{ id: string }>((resolve, reject) => {
            input.pipe(cipher).pipe(output);

            output.on('finish', async () => {
                const tag = cipher.getAuthTag();
                // Append tag to the end of the encrypted file
                fs.appendFileSync(filePath, tag);

                try {
                    // Upload the encrypted binary file to Cloudinary
                    const result = await cloudinary.uploader.upload(filePath, { 
                        resource_type: 'raw', 
                        public_id: fileId 
                    });

                    // 4. Save Record
                    const record = await prisma.fileRecord.create({
                        data: {
                            id: fileId,
                            filename: originalName,
                            storage_path: result.secure_url, // Save secure URL
                            wrapped_key: storedWrappedKey,
                            ownerId: ownerId,
                        },
                    });

                    // Cleanup temp files
                    fs.unlinkSync(file.path);
                    fs.unlinkSync(filePath);

                    resolve({ id: record.id });
                } catch(err) {
                    console.error('[ERROR] Cloudinary upload failed:', err);
                    reject(err);
                }
            });

            input.on('error', reject);
            cipher.on('error', reject);
        });
    }

    static async downloadFile(fileId: string): Promise<{ buffer: Buffer; filename: string }> {
        const record = await prisma.fileRecord.findUnique({ where: { id: fileId } });
        if (!record) throw new Error('File not found');

        // 1. Unwrap DEK
        const wrappedBuffer = record.wrapped_key;
        const dekIv = wrappedBuffer.subarray(0, 16);
        const keyTag = wrappedBuffer.subarray(16, 32);
        const encryptedDek = wrappedBuffer.subarray(32);

        const keyDecipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, dekIv);
        keyDecipher.setAuthTag(keyTag);
        let dek = keyDecipher.update(encryptedDek);
        dek = Buffer.concat([dek, keyDecipher.final()]);

        // 2. Download File from Cloudinary
        const response = await axios.get(record.storage_path, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(response.data);

        // Extract metadata and ciphertext
        const fileIv = fileBuffer.subarray(0, 16);
        const tag = fileBuffer.subarray(fileBuffer.length - 16);
        const ciphertext = fileBuffer.subarray(16, fileBuffer.length - 16);

        // 3. Decrypt
        const decipher = crypto.createDecipheriv(ALGORITHM, dek, fileIv);
        decipher.setAuthTag(tag);

        let plaintext = decipher.update(ciphertext);
        plaintext = Buffer.concat([plaintext, decipher.final()]);

        return { buffer: plaintext, filename: record.filename };
    }
}
