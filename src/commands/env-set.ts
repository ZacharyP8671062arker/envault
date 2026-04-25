import * as fs from 'fs';
import * as path from 'path';
import { loadVault, saveVault } from './add';
import { loadPublicKey } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { enforcePolicy } from './policy';
import { logAction } from '../crypto/auditLogger';

export interface EnvSetOptions {
  vaultPath?: string;
  publicKeyPath?: string;
  force?: boolean;
}

/**
 * Parse a KEY=VALUE string into its parts.
 * Supports quoted values: KEY="some value"
 */
export function parseKeyValue(input: string): { key: string; value: string } {
  const eqIdx = input.indexOf('=');
  if (eqIdx === -1) {
    throw new Error(`Invalid KEY=VALUE format: "${input}"`);
  }
  const key = input.slice(0, eqIdx).trim();
  let value = input.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!key || !/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    throw new Error(`Invalid environment variable name: "${key}"`);
  }
  return { key, value };
}

/**
 * Set (add or update) one or more KEY=VALUE pairs in the vault.
 */
export async function runEnvSet(
  entries: string[],
  options: EnvSetOptions = {}
): Promise<void> {
  const vaultPath = options.vaultPath ?? '.envault/vault.json';
  const pubKeyPath = options.publicKeyPath ?? '.envault/public.pem';

  if (!fs.existsSync(pubKeyPath)) {
    throw new Error(`Public key not found at ${pubKeyPath}. Run 'envault init' first.`);
  }

  const publicKey = loadPublicKey(pubKeyPath);
  const vault = loadVault(vaultPath);

  const parsed = entries.map(parseKeyValue);

  for (const { key, value } of parsed) {
    enforcePolicy(vault, key, options.force);
    const encrypted = encryptWithPublicKey(publicKey, value);
    const isUpdate = key in vault;
    vault[key] = encrypted;
    logAction(isUpdate ? 'update' : 'set', key);
    console.log(`${isUpdate ? 'Updated' : 'Set'} key: ${key}`);
  }

  saveVault(vaultPath, vault);
}
