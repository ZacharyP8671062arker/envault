import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import { loadQuota, saveQuota, checkQuota, runQuota, QuotaConfig } from './quota';

vi.mock('fs');

const mockVault: Record<string, string> = {
  API_KEY: 'abc123',
  DB_URL: 'postgres://localhost/mydb',
  SECRET: 'supersecret',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('loadQuota', () => {
  it('returns empty object when quota file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(loadQuota()).toEqual({});
  });

  it('returns parsed config when file exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ maxKeys: 10 }));
    expect(loadQuota()).toEqual({ maxKeys: 10 });
  });
});

describe('saveQuota', () => {
  it('creates directory and writes config', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const config: QuotaConfig = { maxKeys: 5, maxValueLength: 100 };
    saveQuota(config);
    expect(fs.mkdirSync).toHaveBeenCalledWith('.envault', { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.envault/quota.json',
      JSON.stringify(config, null, 2)
    );
  });
});

describe('checkQuota', () => {
  it('returns no violations when no limits set', () => {
    const status = checkQuota(mockVault, {});
    expect(status.violations).toHaveLength(0);
    expect(status.keyCount).toBe(3);
  });

  it('reports violation when key count exceeds limit', () => {
    const status = checkQuota(mockVault, { maxKeys: 2 });
    expect(status.violations).toContain('Key count 3 exceeds limit of 2');
  });

  it('reports violation when value length exceeds limit', () => {
    const status = checkQuota(mockVault, { maxValueLength: 5 });
    expect(status.violations.some(v => v.includes('DB_URL'))).toBe(true);
  });

  it('reports violation when vault size exceeds limit', () => {
    const status = checkQuota(mockVault, { maxVaultSizeBytes: 1 });
    expect(status.violations.some(v => v.includes('Vault size'))).toBe(true);
  });

  it('tracks maxValueLengthFound correctly', () => {
    const status = checkQuota(mockVault, {});
    expect(status.maxValueLengthFound).toBe('postgres://localhost/mydb'.length);
  });
});

describe('runQuota', () => {
  it('prints no quota limits when config is empty', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    runQuota('get', mockVault);
    expect(spy).toHaveBeenCalledWith('No quota limits configured.');
    spy.mockRestore();
  });

  it('prints all checks passed when no violations', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ maxKeys: 100 }));
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    runQuota('check', mockVault);
    expect(spy).toHaveBeenCalledWith('✓ All quota checks passed.');
    spy.mockRestore();
  });
});
