import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE = '.envault-cache.json';

export interface CacheEntry {
  key: string;
  hash: string;
  cachedAt: string;
}

export interface VaultCache {
  entries: Record<string, CacheEntry>;
  updatedAt: string;
}

export function loadCache(dir: string = '.'): VaultCache {
  const cachePath = path.join(dir, CACHE_FILE);
  if (!fs.existsSync(cachePath)) {
    return { entries: {}, updatedAt: new Date().toISOString() };
  }
  const raw = fs.readFileSync(cachePath, 'utf-8');
  return JSON.parse(raw) as VaultCache;
}

export function saveCache(cache: VaultCache, dir: string = '.'): void {
  const cachePath = path.join(dir, CACHE_FILE);
  cache.updatedAt = new Date().toISOString();
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

export function setCacheEntry(key: string, hash: string, dir: string = '.'): void {
  const cache = loadCache(dir);
  cache.entries[key] = { key, hash, cachedAt: new Date().toISOString() };
  saveCache(cache, dir);
}

export function getCacheEntry(key: string, dir: string = '.'): CacheEntry | undefined {
  const cache = loadCache(dir);
  return cache.entries[key];
}

export function removeCacheEntry(key: string, dir: string = '.'): boolean {
  const cache = loadCache(dir);
  if (!cache.entries[key]) return false;
  delete cache.entries[key];
  saveCache(cache, dir);
  return true;
}

export function clearCache(dir: string = '.'): void {
  saveCache({ entries: {}, updatedAt: new Date().toISOString() }, dir);
}

export function isCacheStale(key: string, currentHash: string, dir: string = '.'): boolean {
  const entry = getCacheEntry(key, dir);
  if (!entry) return true;
  return entry.hash !== currentHash;
}

export function runCache(args: string[]): void {
  const [subcommand, ...rest] = args;
  if (subcommand === 'clear') {
    clearCache();
    console.log('Cache cleared.');
  } else if (subcommand === 'show') {
    const cache = loadCache();
    if (Object.keys(cache.entries).length === 0) {
      console.log('Cache is empty.');
    } else {
      console.log(`Cache last updated: ${cache.updatedAt}`);
      for (const entry of Object.values(cache.entries)) {
        console.log(`  ${entry.key}  hash=${entry.hash}  cachedAt=${entry.cachedAt}`);
      }
    }
  } else if (subcommand === 'remove' && rest[0]) {
    const removed = removeCacheEntry(rest[0]);
    console.log(removed ? `Removed cache entry: ${rest[0]}` : `No cache entry found for: ${rest[0]}`);
  } else {
    console.log('Usage: envault cache <show|clear|remove <key>>');
  }
}
