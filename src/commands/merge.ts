import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';
import { appendAuditEntry } from './audit';

export type MergeStrategy = 'ours' | 'theirs' | 'interactive';

export interface MergeResult {
  added: string[];
  updated: string[];
  skipped: string[];
  conflicts: string[];
}

export function mergeVaults(
  baseVault: Record<string, string>,
  incomingVault: Record<string, string>,
  strategy: MergeStrategy = 'ours'
): { merged: Record<string, string>; result: MergeResult } {
  const merged: Record<string, string> = { ...baseVault };
  const result: MergeResult = { added: [], updated: [], skipped: [], conflicts: [] };

  for (const [key, value] of Object.entries(incomingVault)) {
    if (!(key in baseVault)) {
      merged[key] = value;
      result.added.push(key);
    } else if (baseVault[key] === value) {
      result.skipped.push(key);
    } else {
      result.conflicts.push(key);
      if (strategy === 'theirs') {
        merged[key] = value;
        result.updated.push(key);
      } else {
        // 'ours' or 'interactive' defaults to keeping ours
        result.skipped.push(key);
        result.conflicts = result.conflicts.filter(k => k !== key);
      }
    }
  }

  return { merged, result };
}

export async function runMerge(
  sourceVaultPath: string,
  strategy: MergeStrategy = 'ours'
): Promise<void> {
  if (!fs.existsSync(sourceVaultPath)) {
    console.error(`Source vault not found: ${sourceVaultPath}`);
    process.exit(1);
  }

  const baseVault = loadVault();
  const rawSource = fs.readFileSync(sourceVaultPath, 'utf-8');
  const incomingVault: Record<string, string> = JSON.parse(rawSource);

  const { merged, result } = mergeVaults(baseVault, incomingVault, strategy);

  saveVault(merged);

  appendAuditEntry({
    action: 'merge',
    detail: `Merged from ${sourceVaultPath} using strategy '${strategy}'. Added: ${result.added.length}, Updated: ${result.updated.length}, Skipped: ${result.skipped.length}, Conflicts: ${result.conflicts.length}`,
    timestamp: new Date().toISOString(),
  });

  console.log(`Merge complete (strategy: ${strategy})`);
  if (result.added.length) console.log(`  Added:    ${result.added.join(', ')}`);
  if (result.updated.length) console.log(`  Updated:  ${result.updated.join(', ')}`);
  if (result.skipped.length) console.log(`  Skipped:  ${result.skipped.join(', ')}`);
  if (result.conflicts.length) console.log(`  Conflicts (kept ours): ${result.conflicts.join(', ')}`);
}
