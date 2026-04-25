import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadCache,
  saveCache,
  setCacheEntry,
  getCacheEntry,
  removeCacheEntry,
  clearCache,
  isCacheStale,
} from './cache';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cache-test-'));
}

describe('cache', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loadCache returns empty cache when file does not exist', () => {
    const cache = loadCache(tmpDir);
    expect(cache.entries).toEqual({});
  });

  it('saveCache and loadCache round-trip', () => {
    const cache = { entries: { FOO: { key: 'FOO', hash: 'abc123', cachedAt: '2024-01-01T00:00:00.000Z' } }, updatedAt: '2024-01-01T00:00:00.000Z' };
    saveCache(cache, tmpDir);
    const loaded = loadCache(tmpDir);
    expect(loaded.entries['FOO'].hash).toBe('abc123');
  });

  it('setCacheEntry adds a new entry', () => {
    setCacheEntry('API_KEY', 'hash1', tmpDir);
    const entry = getCacheEntry('API_KEY', tmpDir);
    expect(entry).toBeDefined();
    expect(entry!.hash).toBe('hash1');
    expect(entry!.key).toBe('API_KEY');
  });

  it('setCacheEntry updates an existing entry', () => {
    setCacheEntry('API_KEY', 'hash1', tmpDir);
    setCacheEntry('API_KEY', 'hash2', tmpDir);
    const entry = getCacheEntry('API_KEY', tmpDir);
    expect(entry!.hash).toBe('hash2');
  });

  it('getCacheEntry returns undefined for missing key', () => {
    const entry = getCacheEntry('MISSING', tmpDir);
    expect(entry).toBeUndefined();
  });

  it('removeCacheEntry removes an existing entry and returns true', () => {
    setCacheEntry('DB_URL', 'hashX', tmpDir);
    const result = removeCacheEntry('DB_URL', tmpDir);
    expect(result).toBe(true);
    expect(getCacheEntry('DB_URL', tmpDir)).toBeUndefined();
  });

  it('removeCacheEntry returns false when key does not exist', () => {
    const result = removeCacheEntry('NONEXISTENT', tmpDir);
    expect(result).toBe(false);
  });

  it('clearCache removes all entries', () => {
    setCacheEntry('A', 'h1', tmpDir);
    setCacheEntry('B', 'h2', tmpDir);
    clearCache(tmpDir);
    const cache = loadCache(tmpDir);
    expect(Object.keys(cache.entries)).toHaveLength(0);
  });

  it('isCacheStale returns true when entry is missing', () => {
    expect(isCacheStale('NEW_KEY', 'somehash', tmpDir)).toBe(true);
  });

  it('isCacheStale returns false when hash matches', () => {
    setCacheEntry('KEY', 'matchinghash', tmpDir);
    expect(isCacheStale('KEY', 'matchinghash', tmpDir)).toBe(false);
  });

  it('isCacheStale returns true when hash differs', () => {
    setCacheEntry('KEY', 'oldhash', tmpDir);
    expect(isCacheStale('KEY', 'newhash', tmpDir)).toBe(true);
  });
});
