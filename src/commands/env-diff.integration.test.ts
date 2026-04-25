import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { saveVault } from './add';
import { computeEnvVaultDiff, formatEnvDiffOutput } from './env-diff';

describe('env-diff integration', () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-diff-'));
    envFile = path.join(tmpDir, '.env');
    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey, tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('shows no diff when local matches vault', async () => {
    const { publicKey } = require('../crypto/keyPair').loadPublicKey(tmpDir)
      ? { publicKey: require('../crypto/keyPair').loadPublicKey(tmpDir) }
      : require('../crypto/keyPair').generateKeyPair();

    const pub = require('../crypto/keyPair').loadPublicKey(tmpDir);
    const vault = { DB_URL: encryptWithPublicKey('postgres://localhost', pub) };
    saveVault(vault, tmpDir);
    fs.writeFileSync(envFile, 'DB_URL=postgres://localhost\n');

    const entries = await computeEnvVaultDiff(envFile, tmpDir);
    const unchanged = entries.filter(e => e.status === 'unchanged');
    const changed = entries.filter(e => e.status !== 'unchanged');
    expect(unchanged).toHaveLength(1);
    expect(changed).toHaveLength(0);
  });

  it('detects a changed key in real vault', async () => {
    const pub = require('../crypto/keyPair').loadPublicKey(tmpDir);
    const vault = { API_KEY: encryptWithPublicKey('old-secret', pub) };
    saveVault(vault, tmpDir);
    fs.writeFileSync(envFile, 'API_KEY=new-secret\n');

    const entries = await computeEnvVaultDiff(envFile, tmpDir);
    expect(entries[0]).toMatchObject({ key: 'API_KEY', status: 'changed', localValue: 'new-secret' });
  });

  it('full diff output contains expected markers', async () => {
    const pub = require('../crypto/keyPair').loadPublicKey(tmpDir);
    const vault = {
      REMOVED_KEY: encryptWithPublicKey('gone', pub),
      SAME_KEY: encryptWithPublicKey('same', pub)
    };
    saveVault(vault, tmpDir);
    fs.writeFileSync(envFile, 'SAME_KEY=same\nNEW_KEY=added\n');

    const entries = await computeEnvVaultDiff(envFile, tmpDir);
    const output = formatEnvDiffOutput(entries);
    expect(output).toContain('- REMOVED_KEY');
    expect(output).toContain('+ NEW_KEY');
    expect(output).not.toContain('SAME_KEY');
  });
});
