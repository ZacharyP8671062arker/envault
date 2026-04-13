import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export function parseEnvLines(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

export function computeDiff(
  localVars: Record<string, string>,
  vaultVars: Record<string, string>
): DiffResult {
  const allKeys = new Set([...Object.keys(localVars), ...Object.keys(vaultVars)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of allKeys) {
    const inLocal = key in localVars;
    const inVault = key in vaultVars;
    if (inLocal && !inVault) {
      added.push(key);
    } else if (!inLocal && inVault) {
      removed.push(key);
    } else if (localVars[key] !== vaultVars[key]) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { added, removed, changed, unchanged };
}

export async function runDiff(envFile: string = '.env'): Promise<void> {
  const envPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`Error: ${envFile} not found.`);
    process.exit(1);
  }

  const localContent = fs.readFileSync(envPath, 'utf-8');
  const localVars = parseEnvLines(localContent);

  const vault = loadVault();
  const privateKey = loadPrivateKey();
  const vaultVars: Record<string, string> = {};

  for (const [key, encryptedValue] of Object.entries(vault)) {
    try {
      vaultVars[key] = decryptWithPrivateKey(encryptedValue as string, privateKey);
    } catch {
      vaultVars[key] = '<decryption-failed>';
    }
  }

  const diff = computeDiff(localVars, vaultVars);

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    console.log('No differences found. Local and vault are in sync.');
    return;
  }

  if (diff.added.length > 0) {
    console.log('\n+ Keys in local but not in vault:');
    diff.added.forEach(k => console.log(`  + ${k}`));
  }
  if (diff.removed.length > 0) {
    console.log('\n- Keys in vault but not in local:');
    diff.removed.forEach(k => console.log(`  - ${k}`));
  }
  if (diff.changed.length > 0) {
    console.log('\n~ Keys with different values:');
    diff.changed.forEach(k => console.log(`  ~ ${k}`));
  }
}
