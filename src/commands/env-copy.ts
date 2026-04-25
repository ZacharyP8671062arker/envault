import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';

export interface CopyResult {
  copied: string[];
  skipped: string[];
  overwritten: string[];
}

export async function copyKeys(
  sourceVaultPath: string,
  destVaultPath: string,
  keys: string[],
  options: { overwrite?: boolean; dryRun?: boolean } = {}
): Promise<CopyResult> {
  const { overwrite = false, dryRun = false } = options;
  const result: CopyResult = { copied: [], skipped: [], overwritten: [] };

  const sourceVault = loadVault(sourceVaultPath);
  const destVault = loadVault(destVaultPath);

  const keysToProcess = keys.length > 0 ? keys : Object.keys(sourceVault);

  for (const key of keysToProcess) {
    if (!(key in sourceVault)) {
      result.skipped.push(key);
      continue;
    }

    if (key in destVault && !overwrite) {
      result.skipped.push(key);
      continue;
    }

    if (key in destVault && overwrite) {
      result.overwritten.push(key);
    } else {
      result.copied.push(key);
    }

    if (!dryRun) {
      destVault[key] = sourceVault[key];
    }
  }

  if (!dryRun && (result.copied.length > 0 || result.overwritten.length > 0)) {
    saveVault(destVaultPath, destVault);
  }

  return result;
}

export async function runEnvCopy(
  sourceVaultPath: string,
  destVaultPath: string,
  keys: string[],
  options: { overwrite?: boolean; dryRun?: boolean } = {}
): Promise<void> {
  const result = await copyKeys(sourceVaultPath, destVaultPath, keys, options);

  if (options.dryRun) {
    console.log('[dry-run] No changes were written.');
  }

  if (result.copied.length > 0) {
    console.log(`Copied: ${result.copied.join(', ')}`);
  }
  if (result.overwritten.length > 0) {
    console.log(`Overwritten: ${result.overwritten.join(', ')}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped: ${result.skipped.join(', ')}`);
  }
  if (result.copied.length === 0 && result.overwritten.length === 0) {
    console.log('No keys were copied.');
  }
}
