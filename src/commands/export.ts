import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';
import { loadPrivateKey } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';

export interface ExportOptions {
  output?: string;
  environment?: string;
  overwrite?: boolean;
}

export async function runExport(options: ExportOptions = {}): Promise<void> {
  const vaultPath = path.resolve('.envault/vault.json');

  if (!fs.existsSync(vaultPath)) {
    throw new Error('No vault found. Run `envault init` first.');
  }

  const vault = loadVault(vaultPath);
  const env = options.environment || 'default';

  if (!vault[env]) {
    throw new Error(`Environment "${env}" not found in vault.`);
  }

  const privateKey = await loadPrivateKey();
  const lines: string[] = [];

  for (const [key, encryptedValue] of Object.entries(vault[env])) {
    const decrypted = decryptWithPrivateKey(encryptedValue as string, privateKey);
    lines.push(`${key}=${decrypted}`);
  }

  const content = lines.join('\n') + '\n';
  const outputPath = options.output || `.env${env === 'default' ? '' : `.${env}`}`;
  const resolvedOutput = path.resolve(outputPath);

  if (fs.existsSync(resolvedOutput) && !options.overwrite) {
    throw new Error(
      `File "${outputPath}" already exists. Use --overwrite to replace it.`
    );
  }

  fs.writeFileSync(resolvedOutput, content, 'utf-8');
  console.log(`Exported ${lines.length} variable(s) to ${outputPath}`);
}
