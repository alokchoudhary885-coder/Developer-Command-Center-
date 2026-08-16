import crypto from 'crypto';
import { env } from '../config/env';

// Ensure 32-byte key for AES-256-GCM
const getKeyBuffer = (): Buffer => {
  const rawKey = env.ENCRYPTION_KEY;
  if (rawKey.length === 64) {
    return Buffer.from(rawKey, 'hex');
  }
  // Fallback hash to guarantee exactly 32 bytes
  return crypto.createHash('sha256').update(rawKey).digest();
};

/**
 * Encrypt plain text using AES-256-GCM
 * Output format: iv:authTag:ciphertext (all in hex)
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM string
 * Input format: iv:authTag:ciphertext (all in hex)
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
