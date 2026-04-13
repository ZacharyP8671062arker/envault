import * as crypto from 'crypto';

const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100_000;
const DIGEST = 'sha256';

export interface DerivedKeyResult {
  key: Buffer;
  salt: Buffer;
}

/**
 * Derives a symmetric key from a passphrase using PBKDF2.
 */
export function deriveKeyFromPassphrase(
  passphrase: string,
  salt?: Buffer
): DerivedKeyResult {
  const usedSalt = salt ?? crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(
    passphrase,
    usedSalt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
  return { key, salt: usedSalt };
}

/**
 * Encrypts a private key PEM string with a passphrase-derived key (AES-256-GCM).
 */
export function encryptPrivateKeyWithPassphrase(
  privateKeyPem: string,
  passphrase: string
): string {
  const { key, salt } = deriveKeyFromPassphrase(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKeyPem, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([salt, iv, authTag, encrypted]);
  return payload.toString('base64');
}

/**
 * Decrypts an encrypted private key PEM string using a passphrase.
 */
export function decryptPrivateKeyWithPassphrase(
  encryptedBase64: string,
  passphrase: string
): string {
  const payload = Buffer.from(encryptedBase64, 'base64');
  const salt = payload.subarray(0, SALT_LENGTH);
  const iv = payload.subarray(SALT_LENGTH, SALT_LENGTH + 12);
  const authTag = payload.subarray(SALT_LENGTH + 12, SALT_LENGTH + 28);
  const encrypted = payload.subarray(SALT_LENGTH + 28);
  const { key } = deriveKeyFromPassphrase(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
