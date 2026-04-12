import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runPush } from './push';
import { generateKeyPair, saveKeyPair, loadPrivateKey } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadVault } from './add';

describe('runPush', () => {
  let tmpDir: string;
  let envPath: string;
  let vaultPath: string;
  let publicKeyPath: string;
  let privateKeyPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-push-'));
    envPath = path.join(tmpDir, '.env');
    vaultPath = path.join(tmpDir, 'vault.json');
    publicKeyPath = path.join(tmpDir, 'public.pem');
    privateKeyPath = path.join(tmpDir, 'private.pem');
    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey, publicKeyPath, privateKeyPath);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should throw if .env file does not exist', async () => {
    await expect(
      runPush({ envPath, vaultPath, publicKeyPath })
    ).rejects.toThrow('Env file not found');
  });

  it('should throw if public key does not exist', async () => {
    fs.writeFileSync(envPath, 'KEY=value\n');
    await expect(
      runPush({ envPath, vaultPath, publicKeyPath: path.join(tmpDir, 'missing.pem') })
    ).rejects.toThrow('Public key not found');
  });

  it('should encrypt and save env variables to vault', async () => {
    fs.writeFileSync(envPath, 'DB_URL=postgres://localhost\nSECRET=abc123\n');
    await runPush({ envPath, vaultPath, publicKeyPath });

    const vault = loadVault(vaultPath);
    expect(Object.keys(vault)).toContain('DB_URL');
    expect(Object.keys(vault)).toContain('SECRET');

    const privateKey = loadPrivateKey(privateKeyPath);
    expect(decryptWithPrivateKey(vault['DB_URL'], privateKey)).toBe('postgres://localhost');
    expect(decryptWithPrivateKey(vault['SECRET'], privateKey)).toBe('abc123');
  });

  it('should skip comment lines and blank lines in .env', async () => {
    fs.writeFileSync(envPath, '# comment\n\nVALID_KEY=hello\n');
    await runPush({ envPath, vaultPath, publicKeyPath });

    const vault = loadVault(vaultPath);
    expect(Object.keys(vault)).toEqual(['VALID_KEY']);
  });
});
