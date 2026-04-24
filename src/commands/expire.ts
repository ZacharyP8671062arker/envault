import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';

const EXPIRE_META_FILE = '.envault/expire.json';

export interface ExpireEntry {
  key: string;
  expiresAt: string; // ISO date string
}

export function loadExpireMeta(): Record<string, string> {
  if (!fs.existsSync(EXPIRE_META_FILE)) return {};
  const raw = fs.readFileSync(EXPIRE_META_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveExpireMeta(meta: Record<string, string>): void {
  const dir = path.dirname(EXPIRE_META_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EXPIRE_META_FILE, JSON.stringify(meta, null, 2));
}

export function setExpiry(key: string, days: number): void {
  const meta = loadExpireMeta();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  meta[key] = expiresAt.toISOString();
  saveExpireMeta(meta);
  console.log(`Key "${key}" will expire on ${expiresAt.toDateString()}.`);
}

export function clearExpiry(key: string): void {
  const meta = loadExpireMeta();
  if (!meta[key]) {
    console.log(`No expiry set for key "${key}".`);
    return;
  }
  delete meta[key];
  saveExpireMeta(meta);
  console.log(`Expiry cleared for key "${key}".`);
}

export function getExpiredKeys(): string[] {
  const meta = loadExpireMeta();
  const now = new Date();
  return Object.entries(meta)
    .filter(([, expiresAt]) => new Date(expiresAt) <= now)
    .map(([key]) => key);
}

export function runExpireCheck(): void {
  const expired = getExpiredKeys();
  if (expired.length === 0) {
    console.log('No expired keys found.');
    return;
  }
  console.log('Expired keys:');
  expired.forEach((key) => console.log(`  - ${key}`));
}

export function purgeExpiredKeys(): void {
  const expired = getExpiredKeys();
  if (expired.length === 0) {
    console.log('No expired keys to purge.');
    return;
  }
  const vault = loadVault();
  expired.forEach((key) => {
    delete vault[key];
    console.log(`Purged expired key: "${key}"`);
  });
  saveVault(vault);
  const meta = loadExpireMeta();
  expired.forEach((key) => delete meta[key]);
  saveExpireMeta(meta);
}
