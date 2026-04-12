import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runSync } from './sync';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { saveVault } from './add';

describe('runSync', () => {
  let tmpDir: string;
  let vaultPath: string;
  let publicKeyPath: string;
  let privateKeyPath: string;
  let outputPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sync-'));
    vaultPath = path.join(tmpDir, 'vault.json');
    publicKeyPath = path.join(tmpDir, 'public.pem');
    privateKeyPath = path.join(tmpDir, 'private.pem');
    outputPath = path.join(tmpDir, '.env');
    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey, publicKeyPath, privateKeyPath);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should throw if vault does not exist', async () => {
    await expect(
      runSync({ vaultPath, outputPath, keyPath: privateKeyPath })
    ).rejects.toThrow('Vault not found');
  });

  it('should throw if private key does not exist', async () => {
    saveVault({}, vaultPath);
    await expect(
      runSync({ vaultPath, outputPath, keyPath: path.join(tmpDir, 'missing.pem') })
    ).rejects.toThrow('Private key not found');
  });

  it('should write decrypted env variables to output file', async () => {
    const { publicKey } = require('../crypto/keyPair').loadPublicKey
      ? { publicKey: fs.readFileSync(publicKeyPath, 'utf-8') }
      : { publicKey: fs.readFileSync(publicKeyPath, 'utf-8') };

    const encrypted = encryptWithPublicKey('secret123', publicKey);
    saveVault({ API_KEY: encrypted }, vaultPath);

    await runSync({ vaultPath, outputPath, keyPath: privateKeyPath });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('API_KEY=secret123');
  });

  it('should handle empty vault gracefully', async () => {
    saveVault({}, vaultPath);
    await runSync({ vaultPath, outputPath, keyPath: privateKeyPath });
    expect(fs.existsSync(outputPath)).toBe(false);
  });
});
