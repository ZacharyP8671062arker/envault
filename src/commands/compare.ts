import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  diffValues: string[];
  matching: string[];
}

export function compareVaults(
  vaultPathA: string,
  vaultPathB: string
): CompareResult {
  const vaultA = loadVault(vaultPathA);
  const vaultB = loadVault(vaultPathB);

  const keysA = new Set(Object.keys(vaultA));
  const keysB = new Set(Object.keys(vaultB));

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const diffValues: string[] = [];
  const matching: string[] = [];

  for (const key of keysA) {
    if (!keysB.has(key)) {
      onlyInA.push(key);
    } else if (vaultA[key] !== vaultB[key]) {
      diffValues.push(key);
    } else {
      matching.push(key);
    }
  }

  for (const key of keysB) {
    if (!keysA.has(key)) {
      onlyInB.push(key);
    }
  }

  return { onlyInA, onlyInB, diffValues, matching };
}

export function formatCompareOutput(
  result: CompareResult,
  labelA = 'vault-a',
  labelB = 'vault-b'
): string {
  const lines: string[] = [];

  if (result.onlyInA.length > 0) {
    lines.push(`Only in ${labelA}:`);
    result.onlyInA.forEach(k => lines.push(`  - ${k}`));
  }

  if (result.onlyInB.length > 0) {
    lines.push(`Only in ${labelB}:`);
    result.onlyInB.forEach(k => lines.push(`  + ${k}`));
  }

  if (result.diffValues.length > 0) {
    lines.push('Different values:');
    result.diffValues.forEach(k => lines.push(`  ~ ${k}`));
  }

  if (lines.length === 0) {
    lines.push('Vaults are identical.');
  } else {
    lines.push(`\nMatching keys: ${result.matching.length}`);
  }

  return lines.join('\n');
}

export function runCompare(args: string[]): void {
  const [vaultA, vaultB] = args;
  if (!vaultA || !vaultB) {
    console.error('Usage: envault compare <vault-a> <vault-b>');
    process.exit(1);
  }

  const labelA = path.basename(vaultA);
  const labelB = path.basename(vaultB);

  try {
    const result = compareVaults(vaultA, vaultB);
    console.log(formatCompareOutput(result, labelA, labelB));
  } catch (err: any) {
    console.error(`Error comparing vaults: ${err.message}`);
    process.exit(1);
  }
}
