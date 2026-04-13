import * as fs from 'fs';
import { loadVault, saveVault } from './add';

export function unshareVaultFromUser(vaultPath: string, username: string): void {
  const vault = loadVault(vaultPath);

  if (!vault.shared || !vault.shared[username]) {
    throw new Error(`User '${username}' does not have shared access to this vault.`);
  }

  delete vault.shared[username];
  saveVault(vaultPath, vault);
  console.log(`Removed shared access for user: ${username}`);
}

export function listSharedUsers(vaultPath: string): string[] {
  const vault = loadVault(vaultPath);
  if (!vault.shared) return [];
  return Object.keys(vault.shared);
}

export async function runUnshare(
  username: string,
  options: { vault?: string } = {}
): Promise<void> {
  const vaultPath = options.vault ?? '.envault/vault.json';

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found at ${vaultPath}. Run 'envault init' first.`);
  }

  unshareVaultFromUser(vaultPath, username);
}
