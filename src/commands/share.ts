import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';
import { loadPublicKey } from '../crypto/keyPair';
import { encryptWithPublicKey, decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

export interface ShareEntry {
  username: string;
  publicKeyPath: string;
  encryptedSecrets: Record<string, string>;
}

export async function shareVaultWithUser(
  vaultPath: string,
  username: string,
  recipientPublicKeyPath: string,
  privateKeyPath: string
): Promise<void> {
  const vault = loadVault(vaultPath);
  const recipientPublicKey = loadPublicKey(recipientPublicKeyPath);
  const privateKey = loadPrivateKey(privateKeyPath);

  const reEncrypted: Record<string, string> = {};

  for (const [key, encryptedValue] of Object.entries(vault.secrets)) {
    const plaintext = decryptWithPrivateKey(encryptedValue, privateKey);
    reEncrypted[key] = encryptWithPublicKey(plaintext, recipientPublicKey);
  }

  if (!vault.shared) {
    vault.shared = {};
  }

  vault.shared[username] = {
    publicKeyPath: recipientPublicKeyPath,
    encryptedSecrets: reEncrypted,
  };

  saveVault(vaultPath, vault);
  console.log(`Vault secrets shared with user: ${username}`);
}

export async function runShare(
  username: string,
  recipientPublicKeyPath: string,
  options: { vault?: string; key?: string } = {}
): Promise<void> {
  const vaultPath = options.vault ?? '.envault/vault.json';
  const privateKeyPath = options.key ?? '.envault/private.pem';

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found at ${vaultPath}. Run 'envault init' first.`);
  }

  if (!fs.existsSync(recipientPublicKeyPath)) {
    throw new Error(`Recipient public key not found at ${recipientPublicKeyPath}`);
  }

  await shareVaultWithUser(vaultPath, username, recipientPublicKeyPath, privateKeyPath);
}
