import * as fs from 'fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadTtlMeta,
  saveTtlMeta,
  setTtl,
  clearTtl,
  getExpiredTtlKeys,
  pruneExpiredTtlKeys,
} from './ttl';

vi.mock('fs');
vi.mock('./add', () => ({
  loadVault: vi.fn(() => ({ MY_KEY: 'encrypted', OTHER_KEY: 'encrypted2' })),
  saveVault: vi.fn(),
}));

const mockMeta = {};

beforeEach(() => {
  vi.mocked(fs.existsSync).mockReturnValue(false);
  vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockMeta));
  vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('loadTtlMeta', () => {
  it('returns empty object when file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(loadTtlMeta()).toEqual({});
  });

  it('parses existing TTL meta file', () => {
    const data = { MY_KEY: { key: 'MY_KEY', createdAt: '2024-01-01T00:00:00.000Z', ttlSeconds: 60, expiresAt: '2024-01-01T00:01:00.000Z' } };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));
    expect(loadTtlMeta()).toEqual(data);
  });
});

describe('setTtl', () => {
  it('writes a new TTL entry with correct expiry', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const before = Date.now();
    setTtl('API_KEY', 3600);
    const after = Date.now();

    const written = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);
    expect(written['API_KEY'].key).toBe('API_KEY');
    expect(written['API_KEY'].ttlSeconds).toBe(3600);
    const expiresAt = new Date(written['API_KEY'].expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600000);
    expect(expiresAt).toBeLessThanOrEqual(after + 3600000);
  });
});

describe('clearTtl', () => {
  it('removes a TTL entry for the given key', () => {
    const data = { MY_KEY: { key: 'MY_KEY', createdAt: '', ttlSeconds: 60, expiresAt: '' } };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));

    clearTtl('MY_KEY');

    const written = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);
    expect(written['MY_KEY']).toBeUndefined();
  });
});

describe('getExpiredTtlKeys', () => {
  it('returns keys whose expiresAt is in the past', () => {
    const past = new Date(Date.now() - 10000).toISOString();
    const future = new Date(Date.now() + 10000).toISOString();
    const data = {
      OLD_KEY: { key: 'OLD_KEY', createdAt: '', ttlSeconds: 1, expiresAt: past },
      NEW_KEY: { key: 'NEW_KEY', createdAt: '', ttlSeconds: 9999, expiresAt: future },
    };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));

    const expired = getExpiredTtlKeys();
    expect(expired).toContain('OLD_KEY');
    expect(expired).not.toContain('NEW_KEY');
  });
});

describe('pruneExpiredTtlKeys', () => {
  it('returns empty array when no keys are expired', () => {
    const future = new Date(Date.now() + 10000).toISOString();
    const data = { LIVE_KEY: { key: 'LIVE_KEY', createdAt: '', ttlSeconds: 9999, expiresAt: future } };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));

    const pruned = pruneExpiredTtlKeys();
    expect(pruned).toHaveLength(0);
  });

  it('removes expired keys from vault and meta', () => {
    const past = new Date(Date.now() - 10000).toISOString();
    const data = { MY_KEY: { key: 'MY_KEY', createdAt: '', ttlSeconds: 1, expiresAt: past } };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));

    const pruned = pruneExpiredTtlKeys();
    expect(pruned).toContain('MY_KEY');
  });
});
