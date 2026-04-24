import * as fs from 'fs';
import { loadExpireMeta, saveExpireMeta, setExpiry, clearExpiry, getExpiredKeys, purgeExpiredKeys } from './expire';

jest.mock('fs');
jest.mock('./add', () => ({
  loadVault: jest.fn(() => ({ API_KEY: 'enc-value', OLD_TOKEN: 'enc-old' })),
  saveVault: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.existsSync.mockReturnValue(false);
});

describe('loadExpireMeta', () => {
  it('returns empty object when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(loadExpireMeta()).toEqual({});
  });

  it('parses existing expire meta file', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: '2030-01-01T00:00:00.000Z' }));
    const meta = loadExpireMeta();
    expect(meta).toHaveProperty('API_KEY');
  });
});

describe('saveExpireMeta', () => {
  it('creates directory and writes file', () => {
    mockFs.existsSync.mockReturnValue(false);
    saveExpireMeta({ MY_KEY: '2030-01-01T00:00:00.000Z' });
    expect(mockFs.mkdirSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });
});

describe('setExpiry', () => {
  it('sets expiry for a key', () => {
    mockFs.existsSync.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    setExpiry('API_KEY', 30);
    expect(mockFs.writeFileSync).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    consoleSpy.mockRestore();
  });
});

describe('clearExpiry', () => {
  it('removes expiry for a key', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: '2030-01-01T00:00:00.000Z' }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    clearExpiry('API_KEY');
    expect(mockFs.writeFileSync).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('logs message when key has no expiry', () => {
    mockFs.existsSync.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    clearExpiry('MISSING_KEY');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No expiry set'));
    consoleSpy.mockRestore();
  });
});

describe('getExpiredKeys', () => {
  it('returns keys whose expiry date has passed', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ OLD_TOKEN: '2000-01-01T00:00:00.000Z', API_KEY: '2099-01-01T00:00:00.000Z' })
    );
    const expired = getExpiredKeys();
    expect(expired).toContain('OLD_TOKEN');
    expect(expired).not.toContain('API_KEY');
  });
});

describe('purgeExpiredKeys', () => {
  it('removes expired keys from vault and meta', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ OLD_TOKEN: '2000-01-01T00:00:00.000Z' }));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    purgeExpiredKeys();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Purged expired key'));
    consoleSpy.mockRestore();
  });
});
