import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  generateKeyPair,
  saveKeyPair,
  loadPublicKey,
  loadPrivateKey,
} from './keyPair';

describe('keyPair', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('generateKeyPair', () => {
    it('should generate a valid RSA key pair', () => {
      const keyPair = generateKeyPair();
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    });

    it('should generate unique key pairs on each call', () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();
      expect(kp1.publicKey).not.toBe(kp2.publicKey);
      expect(kp1.privateKey).not.toBe(kp2.privateKey);
    });
  });

  describe('saveKeyPair', () => {
    it('should save keys to the specified directory', () => {
      const keyPair = generateKeyPair();
      const { publicKeyPath, privateKeyPath } = saveKeyPair(keyPair, tmpDir);

      expect(fs.existsSync(publicKeyPath)).toBe(true);
      expect(fs.existsSync(privateKeyPath)).toBe(true);
    });

    it('should create output directory if it does not exist', () => {
      const keyPair = generateKeyPair();
      const nestedDir = path.join(tmpDir, 'nested', 'keys');
      saveKeyPair(keyPair, nestedDir);

      expect(fs.existsSync(nestedDir)).toBe(true);
    });

    it('should set private key file permissions to 0o600', () => {
      const keyPair = generateKeyPair();
      const { privateKeyPath } = saveKeyPair(keyPair, tmpDir);
      const stats = fs.statSync(privateKeyPath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);
    });
  });

  describe('loadPublicKey / loadPrivateKey', () => {
    it('should load saved keys correctly', () => {
      const keyPair = generateKeyPair();
      const { publicKeyPath, privateKeyPath } = saveKeyPair(keyPair, tmpDir);

      expect(loadPublicKey(publicKeyPath)).toBe(keyPair.publicKey);
      expect(loadPrivateKey(privateKeyPath)).toBe(keyPair.privateKey);
    });

    it('should throw if public key file does not exist', () => {
      expect(() => loadPublicKey('/nonexistent/path/key.pub')).toThrow(
        'Public key not found at: /nonexistent/path/key.pub'
      );
    });

    it('should throw if private key file does not exist', () => {
      expect(() => loadPrivateKey('/nonexistent/path/key')).toThrow(
        'Private key not found at: /nonexistent/path/key'
      );
    });
  });
});
