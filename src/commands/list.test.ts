import * as fs from 'fs';
import * as path from 'path';
import { listVaultKeys, runList } from './list';
import { loadVault } from './add';

jest.mock('./add');
jest.mock('fs');

const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockFsExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('listVaultKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if vault file does not exist', () => {
    mockFsExistsSync.mockReturnValue(false);
    expect(() => listVaultKeys()).toThrow('No vault found. Run `envault init` first.');
  });

  it('returns empty array when vault has no entries', () => {
    mockFsExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({ entries: {} } as any);
    const result = listVaultKeys();
    expect(result).toEqual([]);
  });

  it('returns list of vault entries with metadata', () => {
    mockFsExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({
      entries: {
        DATABASE_URL: { addedAt: '2024-01-01T00:00:00Z', addedBy: 'alice', encrypted: 'abc' },
        API_KEY: { addedAt: '2024-01-02T00:00:00Z', addedBy: 'bob', encrypted: 'xyz' },
      },
    } as any);

    const result = listVaultKeys();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: 'DATABASE_URL', addedBy: 'alice' });
    expect(result[1]).toMatchObject({ key: 'API_KEY', addedBy: 'bob' });
  });

  it('handles missing metadata fields gracefully', () => {
    mockFsExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({
      entries: {
        SECRET: { encrypted: 'enc' },
      },
    } as any);

    const result = listVaultKeys();
    expect(result[0].addedAt).toBe('unknown');
    expect(result[0].addedBy).toBe('unknown');
  });
});

describe('runList', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints message when vault is empty', () => {
    mockFsExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({ entries: {} } as any);
    runList();
    expect(consoleSpy).toHaveBeenCalledWith('No secrets stored in vault.');
  });

  it('outputs JSON when json option is set', () => {
    mockFsExistsSync.mockReturnValue(true);
    mockLoadVault.mockReturnValue({
      entries: { MY_SECRET: { addedAt: '2024-01-01T00:00:00Z', addedBy: 'dev', encrypted: 'e' } },
    } as any);
    runList({ json: true });
    const call = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].key).toBe('MY_SECRET');
  });
});
