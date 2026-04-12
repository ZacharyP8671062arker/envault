import { generateKeyPairSync, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KeyPairPaths {
  publicKeyPath: string;
  privateKeyPath: string;
}

export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

export function saveKeyPair(keyPair: KeyPair, outputDir: string): KeyPairPaths {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const publicKeyPath = path.join(outputDir, 'envault_key.pub');
  const privateKeyPath = path.join(outputDir, 'envault_key');

  fs.writeFileSync(publicKeyPath, keyPair.publicKey, { encoding: 'utf8', mode: 0o644 });
  fs.writeFileSync(privateKeyPath, keyPair.privateKey, { encoding: 'utf8', mode: 0o600 });

  return { publicKeyPath, privateKeyPath };
}

export function loadPublicKey(publicKeyPath: string): string {
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Public key not found at: ${publicKeyPath}`);
  }
  return fs.readFileSync(publicKeyPath, 'utf8');
}

export function loadPrivateKey(privateKeyPath: string): string {
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Private key not found at: ${privateKeyPath}`);
  }
  return fs.readFileSync(privateKeyPath, 'utf8');
}
