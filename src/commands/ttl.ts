import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';

const TTL_META_FILE = '.envault/ttl.json';

export interface TtlEntry {
  key: string;
  createdAt: string;
  ttlSeconds: number;
  expiresAt: string;
}

export type TtlMeta = Record<string, TtlEntry>;

export function loadTtlMeta(): TtlMeta {
  if (!fs.existsSync(TTL_META_FILE)) return {};
  return JSON.parse(fs.readFileSync(TTL_META_FILE, 'utf-8'));
}

export function saveTtlMeta(meta: TtlMeta): void {
  fs.mkdirSync(path.dirname(TTL_META_FILE), { recursive: true });
  fs.writeFileSync(TTL_META_FILE, JSON.stringify(meta, null, 2));
}

export function setTtl(key: string, ttlSeconds: number): void {
  const meta = loadTtlMeta();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  meta[key] = {
    key,
    createdAt: now.toISOString(),
    ttlSeconds,
    expiresAt: expiresAt.toISOString(),
  };
  saveTtlMeta(meta);
}

export function clearTtl(key: string): void {
  const meta = loadTtlMeta();
  delete meta[key];
  saveTtlMeta(meta);
}

export function getExpiredTtlKeys(): string[] {
  const meta = loadTtlMeta();
  const now = new Date();
  return Object.values(meta)
    .filter((entry) => new Date(entry.expiresAt) <= now)
    .map((entry) => entry.key);
}

export function pruneExpiredTtlKeys(): string[] {
  const expired = getExpiredTtlKeys();
  if (expired.length === 0) return [];

  const vault = loadVault();
  for (const key of expired) {
    delete vault[key];
  }
  saveVault(vault);

  const meta = loadTtlMeta();
  for (const key of expired) {
    delete meta[key];
  }
  saveTtlMeta(meta);

  return expired;
}

export function runTtl(args: string[]): void {
  const [subcommand, key, ttlArg] = args;

  if (subcommand === 'set' && key && ttlArg) {
    const seconds = parseInt(ttlArg, 10);
    if (isNaN(seconds) || seconds <= 0) {
      console.error('TTL must be a positive integer (seconds).');
      process.exit(1);
    }
    setTtl(key, seconds);
    const expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
    console.log(`TTL set for "${key}": expires at ${expiresAt}`);
  } else if (subcommand === 'clear' && key) {
    clearTtl(key);
    console.log(`TTL cleared for "${key}".`);
  } else if (subcommand === 'prune') {
    const pruned = pruneExpiredTtlKeys();
    if (pruned.length === 0) {
      console.log('No expired keys to prune.');
    } else {
      console.log(`Pruned ${pruned.length} expired key(s): ${pruned.join(', ')}`);
    }
  } else if (subcommand === 'list') {
    const meta = loadTtlMeta();
    const entries = Object.values(meta);
    if (entries.length === 0) {
      console.log('No TTL entries found.');
      return;
    }
    const now = new Date();
    for (const entry of entries) {
      const expired = new Date(entry.expiresAt) <= now;
      const status = expired ? '[EXPIRED]' : '[active]';
      console.log(`  ${status} ${entry.key} — expires ${entry.expiresAt}`);
    }
  } else {
    console.error('Usage: envault ttl <set <key> <seconds> | clear <key> | prune | list>');
    process.exit(1);
  }
}
