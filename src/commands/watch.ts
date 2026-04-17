import fs from 'fs';
import path from 'path';
import { loadVault, saveVault } from './add';
import { parseEnvFile } from './push';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';
import { logAction } from '../crypto/auditLogger';

const VAULT_FILE = '.envault/vault.json';
const ENV_FILE = '.env';

export async function watchEnvFile(envPath: string = ENV_FILE): Promise<void> {
  const absPath = path.resolve(envPath);

  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`Watching ${absPath} for changes...`);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  fs.watch(absPath, async (eventType) => {
    if (eventType !== 'change') return;
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      try {
        await syncEnvToVault(absPath);
        console.log(`[${new Date().toISOString()}] Vault updated from ${envPath}`);
      } catch (err) {
        console.error('Failed to sync vault:', (err as Error).message);
      }
    }, 300);
  });
}

export async function syncEnvToVault(envPath: string): Promise<void> {
  const content = fs.readFileSync(envPath, 'utf-8');
  const entries = parseEnvFile(content);
  const publicKey = await loadPublicKey();
  const vault = loadVault(VAULT_FILE);

  for (const [key, value] of Object.entries(entries)) {
    const encrypted = await encryptWithPublicKey(value, publicKey);
    vault[key] = encrypted;
  }

  saveVault(VAULT_FILE, vault);
  await logAction('watch-sync', `Synced ${Object.keys(entries).length} keys from ${envPath}`);
}

export async function runWatch(args: string[]): Promise<void> {
  const envPath = args[0] || ENV_FILE;
  await watchEnvFile(envPath);
}
