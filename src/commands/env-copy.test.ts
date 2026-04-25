import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyKeys, runEnvCopy } from './env-copy';
import { saveVault } from './add';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-env-copy-'));
}

describe('copyKeys', () => {
  let tmpDir: string;
  let sourceVault: string;
  let destVault: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    sourceVault = path.join(tmpDir, 'source.vault.json');
    destVault = path.join(tmpDir, 'dest.vault.json');
    saveVault(sourceVault, { API_KEY: 'enc_api', DB_URL: 'enc_db', SECRET: 'enc_secret' });
    saveVault(destVault, { EXISTING: 'enc_existing' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies specified keys from source to dest', async () => {
    const result = await copyKeys(sourceVault, destVault, ['API_KEY', 'DB_URL']);
    expect(result.copied).toEqual(['API_KEY', 'DB_URL']);
    expect(result.skipped).toEqual([]);
    expect(result.overwritten).toEqual([]);
  });

  it('copies all keys when no keys specified', async () => {
    const result = await copyKeys(sourceVault, destVault, []);
    expect(result.copied.sort()).toEqual(['API_KEY', 'DB_URL', 'SECRET'].sort());
  });

  it('skips keys not present in source', async () => {
    const result = await copyKeys(sourceVault, destVault, ['MISSING_KEY']);
    expect(result.skipped).toContain('MISSING_KEY');
    expect(result.copied).toHaveLength(0);
  });

  it('skips existing dest keys without overwrite flag', async () => {
    saveVault(destVault, { API_KEY: 'old_value' });
    const result = await copyKeys(sourceVault, destVault, ['API_KEY']);
    expect(result.skipped).toContain('API_KEY');
  });

  it('overwrites existing dest keys with overwrite flag', async () => {
    saveVault(destVault, { API_KEY: 'old_value' });
    const result = await copyKeys(sourceVault, destVault, ['API_KEY'], { overwrite: true });
    expect(result.overwritten).toContain('API_KEY');
    expect(result.copied).toHaveLength(0);
  });

  it('does not write to disk in dry-run mode', async () => {
    const before = fs.readFileSync(destVault, 'utf-8');
    await copyKeys(sourceVault, destVault, ['API_KEY'], { dryRun: true });
    const after = fs.readFileSync(destVault, 'utf-8');
    expect(before).toEqual(after);
  });

  it('persists copied keys to dest vault', async () => {
    await copyKeys(sourceVault, destVault, ['SECRET']);
    const raw = JSON.parse(fs.readFileSync(destVault, 'utf-8'));
    expect(raw['SECRET']).toBe('enc_secret');
  });
});

describe('runEnvCopy', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prints copied keys', async () => {
    const src = path.join(tmpDir, 'src.vault.json');
    const dst = path.join(tmpDir, 'dst.vault.json');
    saveVault(src, { FOO: 'bar' });
    saveVault(dst, {});
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runEnvCopy(src, dst, ['FOO']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('FOO'));
    spy.mockRestore();
  });
});
