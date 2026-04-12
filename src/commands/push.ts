import * as fs from 'fs';
import { loadVault, saveVault } from './add';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';

export interface PushOptions {
  envPath?: string;
  vaultPath?: string;
  publicKeyPath?: string;
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export async function runPush(options: PushOptions = {}): Promise<void> {
  const envPath = options.envPath ?? '.env';
  const vaultPath = options.vaultPath ?? '.envault/vault.json';
  const publicKeyPath = options.publicKeyPath ?? '.envault/public.pem';

  if (!fs.existsSync(envPath)) {
    throw new Error(`Env file not found at ${envPath}.`);
  }

  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Public key not found at ${publicKeyPath}. Run 'envault init' first.`);
  }

  const publicKey = loadPublicKey(publicKeyPath);
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = parseEnvFile(envContent);

  const existingVault = fs.existsSync(vaultPath) ? loadVault(vaultPath) : {};
  const updatedVault: Record<string, string> = { ...existingVault };

  let count = 0;
  for (const [key, value] of Object.entries(envVars)) {
    updatedVault[key] = encryptWithPublicKey(value, publicKey);
    count++;
  }

  saveVault(updatedVault, vaultPath);
  console.log(`Pushed ${count} variable(s) to vault at ${vaultPath}`);
}
