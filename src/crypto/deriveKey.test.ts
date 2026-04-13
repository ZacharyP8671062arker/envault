import {
  deriveKeyFromPassphrase,
  encryptPrivateKeyWithPassphrase,
  decryptPrivateKeyWithPassphrase,
} from './deriveKey';

describe('deriveKeyFromPassphrase', () => {
  it('returns a 32-byte key and 32-byte salt', () => {
    const { key, salt } = deriveKeyFromPassphrase('my-secret');
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
    expect(salt).toBeInstanceOf(Buffer);
    expect(salt.length).toBe(32);
  });

  it('produces the same key when given the same salt', () => {
    const { key: k1, salt } = deriveKeyFromPassphrase('passphrase');
    const { key: k2 } = deriveKeyFromPassphrase('passphrase', salt);
    expect(k1.equals(k2)).toBe(true);
  });

  it('produces different keys for different passphrases', () => {
    const { key: k1, salt } = deriveKeyFromPassphrase('pass1');
    const { key: k2 } = deriveKeyFromPassphrase('pass2', salt);
    expect(k1.equals(k2)).toBe(false);
  });
});

describe('encryptPrivateKeyWithPassphrase / decryptPrivateKeyWithPassphrase', () => {
  const fakePem = '-----BEGIN PRIVATE KEY-----\nMIIFakePemData\n-----END PRIVATE KEY-----';
  const passphrase = 'super-secret-pass';

  it('encrypts and decrypts back to original PEM', () => {
    const encrypted = encryptPrivateKeyWithPassphrase(fakePem, passphrase);
    const decrypted = decryptPrivateKeyWithPassphrase(encrypted, passphrase);
    expect(decrypted).toBe(fakePem);
  });

  it('encrypted output is a base64 string', () => {
    const encrypted = encryptPrivateKeyWithPassphrase(fakePem, passphrase);
    expect(typeof encrypted).toBe('string');
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
  });

  it('throws on wrong passphrase during decryption', () => {
    const encrypted = encryptPrivateKeyWithPassphrase(fakePem, passphrase);
    expect(() =>
      decryptPrivateKeyWithPassphrase(encrypted, 'wrong-pass')
    ).toThrow();
  });

  it('produces different ciphertext each call (random IV + salt)', () => {
    const enc1 = encryptPrivateKeyWithPassphrase(fakePem, passphrase);
    const enc2 = encryptPrivateKeyWithPassphrase(fakePem, passphrase);
    expect(enc1).not.toBe(enc2);
  });
});
