import * as fs from 'fs';
import * as path from 'path';
import { findOrphanedKeys, runClean } from './clean';
import { saveVault, loadVault } from './add';

jest.mock('../crypto/auditLogger', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./add', () => ({
  loadVault: jest.fn(),
  saveVault: jest.fn(),
}));

const mockLoad = loadVault as jest.Mock;
const mockSave = saveVault as jest.Mock;

describe('findOrphanedKeys', () => {
  const tmpEnv = '/tmp/test-clean.env';

  afterEach(() => { if (fs.existsSync(tmpEnv)) fs.unlinkSync(tmpEnv); });

  it('returns keys not present in .env file', () => {
    fs.writeFileSync(tmpEnv, 'API_KEY=abc\nDB_URL=xyz\n');
    const vault = { API_KEY: 'enc1', OLD_KEY: 'enc2', DB_URL: 'enc3' };
    const orphans = findOrphanedKeys(vault, tmpEnv);
    expect(orphans).toEqual(['OLD_KEY']);
  });

  it('returns all keys if .env does not exist', () => {
    const vault = { KEY1: 'enc1', KEY2: 'enc2' };
    const orphans = findOrphanedKeys(vault, '/nonexistent/.env');
    expect(orphans).toEqual([]);
  });

  it('ignores comment lines in .env', () => {
    fs.writeFileSync(tmpEnv, '# comment\nAPI_KEY=val\n');
    const vault = { API_KEY: 'enc', STALE: 'enc2' };
    const orphans = findOrphanedKeys(vault, tmpEnv);
    expect(orphans).toEqual(['STALE']);
  });

  it('returns empty array when all keys are active', () => {
    fs.writeFileSync(tmpEnv, 'FOO=1\nBAR=2\n');
    const vault = { FOO: 'e1', BAR: 'e2' };
    expect(findOrphanedKeys(vault, tmpEnv)).toEqual([]);
  });
});

describe('runClean', () => {
  const tmpEnv = '/tmp/run-clean.env';

  beforeEach(() => {
    fs.writeFileSync(tmpEnv, 'ACTIVE=1\n');
    mockLoad.mockReturnValue({ ACTIVE: 'enc1', STALE: 'enc2' });
  });

  afterEach(() => { if (fs.existsSync(tmpEnv)) fs.unlinkSync(tmpEnv); jest.clearAllMocks(); });

  it('removes orphaned keys and saves vault', async () => {
    const result = await runClean('vault.json', tmpEnv, false);
    expect(result.removed).toEqual(['STALE']);
    expect(mockSave).toHaveBeenCalledWith('vault.json', { ACTIVE: 'enc1' });
  });

  it('dry-run does not save', async () => {
    const result = await runClean('vault.json', tmpEnv, true);
    expect(result.removed).toEqual(['STALE']);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('reports clean when no orphans', async () => {
    mockLoad.mockReturnValue({ ACTIVE: 'enc1' });
    const result = await runClean('vault.json', tmpEnv, false);
    expect(result.removed).toEqual([]);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
