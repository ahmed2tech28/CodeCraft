import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'codecraft-default-secret-key-32b-length-must-be-sufficient';
  return crypto.scryptSync(secret, 'codecraft-salt-key-v1', 32);
}

/**
 * Encrypts a sensitive string (such as an API key) using AES-256-GCM.
 * Returns null if input is null or undefined.
 * Formatted as enc:<iv>:<authTag>:<ciphertext>
 */
export function encryptSecret(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  // If already encrypted, return as is
  if (text.startsWith('enc:')) return text;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Returns original string if not encrypted (for backward compatibility).
 */
export function decryptSecret(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || typeof encryptedText !== 'string') return null;
  if (!encryptedText.startsWith('enc:')) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    const ivHex = parts[1];
    const authTagHex = parts[2];
    const encryptedHex = parts[3];

    if (!ivHex || !authTagHex || !encryptedHex) return encryptedText;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return null if decryption fails (e.g., key changed)
    return null;
  }
}

/**
 * Masks an API key for public client responses.
 * E.g. "AIzaSyABC123456789..." -> "AIzaSy...789"
 */
export function maskApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey || typeof apiKey !== 'string') return null;
  const plainKey = decryptSecret(apiKey) || apiKey;
  if (plainKey.length <= 8) return '****';
  return `${plainKey.slice(0, 6)}...${plainKey.slice(-4)}`;
}
