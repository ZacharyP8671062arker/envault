import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';
import { logAction } from '../crypto/auditLogger';

const VAULT_PATH = path.resolve('.envault', 'vault.json');

export async function renameVaultKey(
  oldKey: string,
  newKey: string,
  vaultPath: string = VAULT_PATH
): Promise<void> {
  if (!oldKey || !newKey) {
    throw new Error('Both old and new key names are required.');
  }

  if (oldKey === newKey) {
    throw new Error('Old and new key names must be different.');
  }

  if (!/^[A-Z0-9_]+$/.test(newKey)) {
    throw new Error('Key names must only contain uppercase letters, digits, and underscores.');
  }

  const vault = await loadVault(vaultPath);

  if (!Object.prototype.hasOwnProperty.call(vault, oldKey)) {
    throw new Error(`Key "${oldKey}" not found in vault.`);
  }

  if (Object.prototype.hasOwnProperty.call(vault, newKey)) {
    throw new Error(`Key "${newKey}" already exists in vault.`);
  }

  vault[newKey] = vault[oldKey];
  delete vault[oldKey];

  await saveVault(vault, vaultPath);
  await logAction('rename', `Renamed key "${oldKey}" to "${newKey}"`);
}

export async function runRename(oldKey: string, newKey: string): Promise<void> {
  try {
    await renameVaultKey(oldKey, newKey);
    console.log(`✔ Renamed "${oldKey}" to "${newKey}" in vault.`);
  } catch (err: any) {
    console.error(`✖ Rename failed: ${err.message}`);
    process.exit(1);
  }
}
