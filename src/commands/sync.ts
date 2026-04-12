import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

export interface SyncOptions {
  vaultPath?: string;
  outputPath?: string;
  keyPath?: string;
}

export async function runSync(options: SyncOptions = {}): Promise<void> {
  const vaultPath = options.vaultPath ?? '.envault/vault.json';
  const outputPath = options.outputPath ?? '.env';
  const keyPath = options.keyPath ?? '.envault/private.pem';

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found at ${vaultPath}. Run 'envault init' first.`);
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found at ${keyPath}. Run 'envault init' first.`);
  }

  const privateKey = loadPrivateKey(keyPath);
  const vault = loadVault(vaultPath);

  if (Object.keys(vault).length === 0) {
    console.log('Vault is empty. Nothing to sync.');
    return;
  }

  const lines: string[] = [];

  for (const [key, encryptedValue] of Object.entries(vault)) {
    const decrypted = decryptWithPrivateKey(encryptedValue, privateKey);
    lines.push(`${key}=${decrypted}`);
  }

  const envContent = lines.join('\n') + '\n';
  fs.writeFileSync(outputPath, envContent, 'utf-8');

  console.log(`Synced ${lines.length} variable(s) to ${outputPath}`);
}
