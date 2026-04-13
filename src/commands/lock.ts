import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
  encryptPrivateKeyWithPassphrase,
  decryptPrivateKeyWithPassphrase,
} from '../crypto/deriveKey';

const PRIVATE_KEY_PATH = path.resolve('.envault', 'private.key');
const LOCKED_KEY_PATH = path.resolve('.envault', 'private.key.locked');

function promptPassphrase(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runLock(): Promise<void> {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('No private key found at', PRIVATE_KEY_PATH);
    process.exit(1);
  }
  if (fs.existsSync(LOCKED_KEY_PATH)) {
    console.error('Private key is already locked.');
    process.exit(1);
  }
  const passphrase = await promptPassphrase('Enter passphrase to lock private key: ');
  if (!passphrase) {
    console.error('Passphrase cannot be empty.');
    process.exit(1);
  }
  const pem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const encrypted = encryptPrivateKeyWithPassphrase(pem, passphrase);
  fs.writeFileSync(LOCKED_KEY_PATH, encrypted, 'utf8');
  fs.unlinkSync(PRIVATE_KEY_PATH);
  console.log('Private key locked successfully.');
}

export async function runUnlock(): Promise<void> {
  if (!fs.existsSync(LOCKED_KEY_PATH)) {
    console.error('No locked private key found.');
    process.exit(1);
  }
  const passphrase = await promptPassphrase('Enter passphrase to unlock private key: ');
  const encrypted = fs.readFileSync(LOCKED_KEY_PATH, 'utf8');
  try {
    const pem = decryptPrivateKeyWithPassphrase(encrypted, passphrase);
    fs.writeFileSync(PRIVATE_KEY_PATH, pem, 'utf8');
    fs.unlinkSync(LOCKED_KEY_PATH);
    console.log('Private key unlocked successfully.');
  } catch {
    console.error('Failed to unlock: incorrect passphrase or corrupted key.');
    process.exit(1);
  }
}
