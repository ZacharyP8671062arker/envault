import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

export interface EnvDiffEntry {
  key: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  localValue?: string;
  vaultValue?: string;
}

export function parseEnvFileToDiff(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

export async function computeEnvVaultDiff(
  envFilePath: string,
  vaultDir: string
): Promise<EnvDiffEntry[]> {
  const localEnv = parseEnvFileToDiff(envFilePath);
  const vault = loadVault(vaultDir);
  const privateKey = loadPrivateKey(vaultDir);

  const vaultEnv: Record<string, string> = {};
  for (const [key, encryptedValue] of Object.entries(vault)) {
    try {
      vaultEnv[key] = decryptWithPrivateKey(encryptedValue, privateKey);
    } catch {
      vaultEnv[key] = '<decryption-failed>';
    }
  }

  const allKeys = new Set([...Object.keys(localEnv), ...Object.keys(vaultEnv)]);
  const entries: EnvDiffEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const inLocal = key in localEnv;
    const inVault = key in vaultEnv;
    if (inLocal && !inVault) {
      entries.push({ key, status: 'added', localValue: localEnv[key] });
    } else if (!inLocal && inVault) {
      entries.push({ key, status: 'removed', vaultValue: vaultEnv[key] });
    } else if (localEnv[key] !== vaultEnv[key]) {
      entries.push({ key, status: 'changed', localValue: localEnv[key], vaultValue: vaultEnv[key] });
    } else {
      entries.push({ key, status: 'unchanged', localValue: localEnv[key], vaultValue: vaultEnv[key] });
    }
  }

  return entries;
}

export function formatEnvDiffOutput(entries: EnvDiffEntry[], showUnchanged = false): string {
  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.status === 'unchanged' && !showUnchanged) continue;
    const prefix = { added: '+', removed: '-', changed: '~', unchanged: ' ' }[entry.status];
    if (entry.status === 'changed') {
      lines.push(`${prefix} ${entry.key}: "${entry.vaultValue}" → "${entry.localValue}"`);
    } else if (entry.status === 'added') {
      lines.push(`${prefix} ${entry.key}=${entry.localValue}`);
    } else if (entry.status === 'removed') {
      lines.push(`${prefix} ${entry.key}=${entry.vaultValue}`);
    } else {
      lines.push(`${prefix} ${entry.key}=${entry.localValue}`);
    }
  }
  return lines.join('\n');
}

export async function runEnvDiff(
  envFilePath: string,
  vaultDir: string,
  showUnchanged = false
): Promise<void> {
  const entries = await computeEnvVaultDiff(envFilePath, vaultDir);
  const output = formatEnvDiffOutput(entries, showUnchanged);
  if (!output.trim()) {
    console.log('No differences found.');
  } else {
    console.log(output);
  }
}
