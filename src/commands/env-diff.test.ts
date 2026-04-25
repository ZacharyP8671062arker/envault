import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFileToDiff, computeEnvVaultDiff, formatEnvDiffOutput, EnvDiffEntry } from './env-diff';

jest.mock('./add');
jest.mock('../crypto/encrypt');
jest.mock('../crypto/keyPair');

import { loadVault } from './add';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockDecrypt = decryptWithPrivateKey as jest.MockedFunction<typeof decryptWithPrivateKey>;
const mockLoadPrivateKey = loadPrivateKey as jest.MockedFunction<typeof loadPrivateKey>;

describe('parseEnvFileToDiff', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.env`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('parses key=value pairs', () => {
    fs.writeFileSync(tmpFile, 'FOO=bar\nBAZ=qux\n');
    expect(parseEnvFileToDiff(tmpFile)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('strips quotes from values', () => {
    fs.writeFileSync(tmpFile, 'FOO="bar"\nBAZ=\'qux\'\n');
    expect(parseEnvFileToDiff(tmpFile)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    fs.writeFileSync(tmpFile, '# comment\n\nFOO=bar\n');
    expect(parseEnvFileToDiff(tmpFile)).toEqual({ FOO: 'bar' });
  });

  it('returns empty object for missing file', () => {
    expect(parseEnvFileToDiff('/nonexistent/.env')).toEqual({});
  });
});

describe('computeEnvVaultDiff', () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    envFile = path.join(tmpDir, '.env');
    mockLoadPrivateKey.mockReturnValue('mock-private-key');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
    jest.clearAllMocks();
  });

  it('detects added keys (in local, not in vault)', async () => {
    fs.writeFileSync(envFile, 'NEW_KEY=newval\n');
    mockLoadVault.mockReturnValue({});
    const result = await computeEnvVaultDiff(envFile, tmpDir);
    expect(result).toEqual([{ key: 'NEW_KEY', status: 'added', localValue: 'newval' }]);
  });

  it('detects removed keys (in vault, not in local)', async () => {
    fs.writeFileSync(envFile, '');
    mockLoadVault.mockReturnValue({ OLD_KEY: 'enc' });
    mockDecrypt.mockReturnValue('oldval');
    const result = await computeEnvVaultDiff(envFile, tmpDir);
    expect(result).toEqual([{ key: 'OLD_KEY', status: 'removed', vaultValue: 'oldval' }]);
  });

  it('detects changed keys', async () => {
    fs.writeFileSync(envFile, 'FOO=newval\n');
    mockLoadVault.mockReturnValue({ FOO: 'enc' });
    mockDecrypt.mockReturnValue('oldval');
    const result = await computeEnvVaultDiff(envFile, tmpDir);
    expect(result[0]).toMatchObject({ key: 'FOO', status: 'changed' });
  });

  it('detects unchanged keys', async () => {
    fs.writeFileSync(envFile, 'FOO=same\n');
    mockLoadVault.mockReturnValue({ FOO: 'enc' });
    mockDecrypt.mockReturnValue('same');
    const result = await computeEnvVaultDiff(envFile, tmpDir);
    expect(result[0]).toMatchObject({ key: 'FOO', status: 'unchanged' });
  });
});

describe('formatEnvDiffOutput', () => {
  it('formats added entries with +', () => {
    const entries: EnvDiffEntry[] = [{ key: 'NEW', status: 'added', localValue: 'val' }];
    expect(formatEnvDiffOutput(entries)).toContain('+ NEW=val');
  });

  it('formats removed entries with -', () => {
    const entries: EnvDiffEntry[] = [{ key: 'OLD', status: 'removed', vaultValue: 'val' }];
    expect(formatEnvDiffOutput(entries)).toContain('- OLD=val');
  });

  it('hides unchanged by default', () => {
    const entries: EnvDiffEntry[] = [{ key: 'FOO', status: 'unchanged', localValue: 'v', vaultValue: 'v' }];
    expect(formatEnvDiffOutput(entries)).toBe('');
  });

  it('shows unchanged when flag is set', () => {
    const entries: EnvDiffEntry[] = [{ key: 'FOO', status: 'unchanged', localValue: 'v', vaultValue: 'v' }];
    expect(formatEnvDiffOutput(entries, true)).toContain('FOO=v');
  });
});
