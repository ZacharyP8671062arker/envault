import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';

export interface VaultEntry {
  key: string;
  addedAt: string;
  addedBy: string;
}

export function listVaultKeys(vaultPath: string = '.envault/vault.json'): VaultEntry[] {
  if (!fs.existsSync(vaultPath)) {
    throw new Error('No vault found. Run `envault init` first.');
  }

  const vault = loadVault(vaultPath);

  if (!vault.entries || Object.keys(vault.entries).length === 0) {
    return [];
  }

  return Object.entries(vault.entries).map(([key, meta]: [string, any]) => ({
    key,
    addedAt: meta.addedAt || 'unknown',
    addedBy: meta.addedBy || 'unknown',
  }));
}

export function runList(options: { vaultPath?: string; json?: boolean } = {}): void {
  const vaultPath = options.vaultPath || '.envault/vault.json';

  let entries: VaultEntry[];

  try {
    entries = listVaultKeys(vaultPath);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log('No secrets stored in vault.');
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  console.log(`\nVault contains ${entries.length} secret(s):\n`);
  console.log('KEY'.padEnd(30) + 'ADDED AT'.padEnd(25) + 'ADDED BY');
  console.log('-'.repeat(75));

  for (const entry of entries) {
    console.log(
      entry.key.padEnd(30) +
      entry.addedAt.padEnd(25) +
      entry.addedBy
    );
  }

  console.log();
}
