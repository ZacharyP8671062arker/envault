import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Encrypts plaintext using a recipient's RSA public key.
 * Uses hybrid encryption: AES-256-GCM for the payload, RSA-OAEP for the AES key.
 */
export function encryptWithPublicKey(
  plaintext: string,
  publicKeyPem: string
): string {
  // Generate a random AES key and IV
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // Encrypt the plaintext with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Encrypt the AES key with the RSA public key
  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    aesKey
  );

  // Bundle everything as a base64-encoded JSON payload
  const payload = {
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64'),
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decrypts a payload produced by encryptWithPublicKey using the RSA private key.
 * @throws {Error} If the payload is malformed or decryption fails.
 */
export function decryptWithPrivateKey(
  encryptedPayload: string,
  privateKeyPem: string
): string {
  let payload: { encryptedKey?: unknown; iv?: unknown; authTag?: unknown; data?: unknown };

  try {
    payload = JSON.parse(
      Buffer.from(encryptedPayload, 'base64').toString('utf8')
    );
  } catch {
    throw new Error('Failed to parse encrypted payload: invalid base64 or JSON');
  }

  if (!payload.encryptedKey || !payload.iv || !payload.authTag || !payload.data) {
    throw new Error('Malformed encrypted payload: missing required fields');
  }

  const encryptedKey = Buffer.from(payload.encryptedKey as string, 'base64');
  const iv = Buffer.from(payload.iv as string, 'base64');
  const authTag = Buffer.from(payload.authTag as string, 'base64');
  const data = Buffer.from(payload.data as string, 'base64');

  // Decrypt the AES key with the RSA private key
  let aesKey: Buffer;
  try {
    aesKey = crypto.privateDecrypt(
      { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      encryptedKey
    );
  } catch {
    throw new Error('Failed to decrypt AES key: invalid private key or corrupted payload');
  }

  // Decrypt the payload with AES-256-GCM
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Failed to decrypt data: authentication tag mismatch or corrupted ciphertext');
  }
}
