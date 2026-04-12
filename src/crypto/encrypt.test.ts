import { generateKeyPair } from './keyPair';
import { encryptWithPublicKey, decryptWithPrivateKey } from './encrypt';

describe('encryptWithPublicKey / decryptWithPrivateKey', () => {
  let publicKeyPem: string;
  let privateKeyPem: string;

  beforeAll(async () => {
    const keys = await generateKeyPair();
    publicKeyPem = keys.publicKey;
    privateKeyPem = keys.privateKey;
  });

  it('should encrypt and decrypt a simple string', () => {
    const original = 'hello envault';
    const encrypted = encryptWithPublicKey(original, publicKeyPem);
    const decrypted = decryptWithPrivateKey(encrypted, privateKeyPem);
    expect(decrypted).toBe(original);
  });

  it('should encrypt and decrypt a multiline .env file content', () => {
    const envContent = [
      'API_KEY=supersecret123',
      'DB_PASSWORD=hunter2',
      'JWT_SECRET=my_jwt_secret',
    ].join('\n');

    const encrypted = encryptWithPublicKey(envContent, publicKeyPem);
    const decrypted = decryptWithPrivateKey(encrypted, privateKeyPem);
    expect(decrypted).toBe(envContent);
  });

  it('should produce different ciphertext on each call (random IV)', () => {
    const plaintext = 'same message';
    const enc1 = encryptWithPublicKey(plaintext, publicKeyPem);
    const enc2 = encryptWithPublicKey(plaintext, publicKeyPem);
    expect(enc1).not.toBe(enc2);
  });

  it('should return a valid base64 string', () => {
    const encrypted = encryptWithPublicKey('test', publicKeyPem);
    const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
    expect(() => JSON.parse(decoded)).not.toThrow();
    const parsed = JSON.parse(decoded);
    expect(parsed).toHaveProperty('encryptedKey');
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('authTag');
    expect(parsed).toHaveProperty('data');
  });

  it('should throw when decrypting with the wrong private key', async () => {
    const { privateKey: wrongPrivateKey } = await generateKeyPair();
    const encrypted = encryptWithPublicKey('secret', publicKeyPem);
    expect(() =>
      decryptWithPrivateKey(encrypted, wrongPrivateKey)
    ).toThrow();
  });
});
