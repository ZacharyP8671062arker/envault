import * as path from 'path';
import * as os from 'os';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';

export interface InitOptions {
  outputDir?: string;
  verbose?: boolean;
}

export interface InitResult {
  publicKeyPath: string;
  privateKeyPath: string;
}

export async function initCommand(options: InitOptions = {}): Promise<InitResult> {
  const outputDir = options.outputDir ?? path.join(os.homedir(), '.envault', 'keys');

  if (options.verbose) {
    console.log('Generating RSA 4096-bit key pair...');
  }

  const keyPair = generateKeyPair();
  const { publicKeyPath, privateKeyPath } = saveKeyPair(keyPair, outputDir);

  if (options.verbose) {
    console.log(`✔ Public key saved to:  ${publicKeyPath}`);
    console.log(`✔ Private key saved to: ${privateKeyPath}`);
    console.log('');
    console.log('Share your PUBLIC key with teammates so they can encrypt secrets for you.');
    console.log('Keep your PRIVATE key safe — never commit it to version control.');
  }

  return { publicKeyPath, privateKeyPath };
}

// CLI entry point (called when run directly via bin)
export function runInit(args: string[]): void {
  const verbose = !args.includes('--quiet') && !args.includes('-q');
  const outputDirFlag = args.indexOf('--output');
  const outputDir =
    outputDirFlag !== -1 && args[outputDirFlag + 1]
      ? args[outputDirFlag + 1]
      : undefined;

  initCommand({ outputDir, verbose })
    .then(() => {
      process.exit(0);
    })
    .catch((err: Error) => {
      console.error(`Error during init: ${err.message}`);
      process.exit(1);
    });
}
