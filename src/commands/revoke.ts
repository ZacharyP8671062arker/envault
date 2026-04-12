import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';

const VAULT_DIR = '.envault';

export async function runRevoke(memberEmail: string): Promise<void> {
  const vaultPath = path.join(VAULT_DIR, 'vault.json');

  if (!fs.existsSync(vaultPath)) {
    throw new Error('No vault found. Run `envault init` first.');
  }

  const vault = await loadVault(vaultPath);

  if (!vault.members || !Array.isArray(vault.members)) {
    throw new Error('Vault has no members list.');
  }

  const memberIndex = vault.members.findIndex(
    (m: { email: string }) => m.email === memberEmail
  );

  if (memberIndex === -1) {
    throw new Error(`Member "${memberEmail}" not found in vault.`);
  }

  vault.members.splice(memberIndex, 1);

  // Remove any encrypted secrets for this member
  if (vault.secrets && typeof vault.secrets === 'object') {
    for (const key of Object.keys(vault.secrets)) {
      if (vault.secrets[key] && typeof vault.secrets[key] === 'object') {
        delete vault.secrets[key][memberEmail];
      }
    }
  }

  await saveVault(vaultPath, vault);
  console.log(`Revoked access for "${memberEmail}" and removed their encrypted secrets.`);
}
