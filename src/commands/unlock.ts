import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { decryptPrivateKeyWithPassphrase } from '../crypto/deriveKey';

const ENVAULT_DIR = '.envault';
const LOCKED_KEY_FILE = path.join(ENVAULT_DIR, 'private.key.locked');
const PRIVATE_KEY_FILE = path.join(ENVAULT_DIR, 'private.key');

export async function promptPassphrase(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runUnlock(): Promise<void> {
  if (!fs.existsSync(LOCKED_KEY_FILE)) {
    console.error('No locked private key found. Run `envault lock` first.');
    process.exit(1);
  }

  const passphrase = await promptPassphrase('Enter passphrase to unlock private key: ');

  try {
    const encryptedData = fs.readFileSync(LOCKED_KEY_FILE, 'utf-8');
    const privateKeyPem = await decryptPrivateKeyWithPassphrase(encryptedData, passphrase);

    fs.writeFileSync(PRIVATE_KEY_FILE, privateKeyPem, { mode: 0o600 });
    console.log('Private key unlocked and saved to', PRIVATE_KEY_FILE);
  } catch {
    console.error('Failed to unlock private key. Incorrect passphrase?');
    process.exit(1);
  }
}
