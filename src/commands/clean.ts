import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';
import { logAction } from '../crypto/auditLogger';

export interface CleanResult {
  removed: string[];
  kept: number;
}

export function findOrphanedKeys(
  vault: Record<string, string>,
  envPath: string
): string[] {
  if (!fs.existsSync(envPath)) return [];

  const raw = fs.readFileSync(envPath, 'utf-8');
  const activeKeys = new Set<string>();

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) activeKeys.add(trimmed.slice(0, eqIdx).trim());
  }

  return Object.keys(vault).filter((k) => !activeKeys.has(k));
}

export async function runClean(
  vaultPath: string = '.envault/vault.json',
  envPath: string = '.env',
  dryRun: boolean = false
): Promise<CleanResult> {
  const vault = loadVault(vaultPath);
  const orphaned = findOrphanedKeys(vault, envPath);

  if (!dryRun && orphaned.length > 0) {
    for (const key of orphaned) {
      delete vault[key];
    }
    saveVault(vaultPath, vault);
    await logAction('clean', { removed: orphaned, dryRun });
  }

  const kept = Object.keys(vault).length;

  if (dryRun) {
    console.log(`[dry-run] Would remove ${orphaned.length} orphaned key(s):`);
  } else {
    console.log(`Removed ${orphaned.length} orphaned key(s) from vault.`);
  }

  for (const key of orphaned) {
    console.log(`  - ${key}`);
  }

  if (orphaned.length === 0) {
    console.log('Vault is already clean.');
  }

  return { removed: orphaned, kept };
}
