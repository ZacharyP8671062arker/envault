import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';

const ENVAULT_DIR = '.envault';
const VAULT_FILE = path.join(ENVAULT_DIR, 'vault.json');

interface VaultEntry {
  key: string;
  encryptedValue: string;
  updatedAt: string;
}

interface Vault {
  entries: VaultEntry[];
}

function loadVault(): Vault {
  if (!fs.existsSync(VAULT_FILE)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
  return JSON.parse(raw) as Vault;
}

function saveVault(vault: Vault): void {
  fs.mkdirSync(ENVAULT_DIR, { recursive: true });
  fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), 'utf-8');
}

async function promptSecret(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runAdd(envKey?: string): Promise<void> {
  const publicKey = loadPublicKey();

  const key = envKey ?? (await promptSecret('Enter env variable name: '));
  if (!key || !/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    console.error('Invalid env variable name.');
    process.exit(1);
  }

  const value = await promptSecret(`Enter value for ${key}: `);
  if (!value) {
    console.error('Value cannot be empty.');
    process.exit(1);
  }

  const encryptedValue = encryptWithPublicKey(publicKey, value);

  const vault = loadVault();
  const existingIndex = vault.entries.findIndex((e) => e.key === key);
  const entry: VaultEntry = { key, encryptedValue, updatedAt: new Date().toISOString() };

  if (existingIndex >= 0) {
    vault.entries[existingIndex] = entry;
    console.log(`Updated encrypted entry for "${key}".`);
  } else {
    vault.entries.push(entry);
    console.log(`Added encrypted entry for "${key}".`);
  }

  saveVault(vault);
}
