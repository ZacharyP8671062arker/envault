import * as fs from 'fs';
import * as path from 'path';
import { loadPublicKey, loadPrivateKey } from '../crypto/keyPair';

export interface DoctorCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export async function runDoctorChecks(): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  // Check .envault directory exists
  const envaultDir = path.resolve('.envault');
  if (fs.existsSync(envaultDir)) {
    checks.push({ name: 'envault directory', status: 'ok', message: '.envault directory found' });
  } else {
    checks.push({ name: 'envault directory', status: 'error', message: '.envault directory missing — run `envault init`' });
    return checks;
  }

  // Check vault file
  const vaultPath = path.join(envaultDir, 'vault.json');
  if (fs.existsSync(vaultPath)) {
    checks.push({ name: 'vault file', status: 'ok', message: 'vault.json found' });
  } else {
    checks.push({ name: 'vault file', status: 'warn', message: 'vault.json missing — no secrets stored yet' });
  }

  // Check public key
  try {
    await loadPublicKey();
    checks.push({ name: 'public key', status: 'ok', message: 'public key loaded successfully' });
  } catch {
    checks.push({ name: 'public key', status: 'error', message: 'public key missing or unreadable' });
  }

  // Check private key
  try {
    await loadPrivateKey();
    checks.push({ name: 'private key', status: 'ok', message: 'private key loaded successfully' });
  } catch {
    checks.push({ name: 'private key', status: 'warn', message: 'private key missing — decryption unavailable (may be locked)' });
  }

  // Check .gitignore contains .envault/keys
  const gitignorePath = path.resolve('.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (content.includes('.envault/keys') || content.includes('.envault/private')) {
      checks.push({ name: '.gitignore', status: 'ok', message: 'private keys are gitignored' });
    } else {
      checks.push({ name: '.gitignore', status: 'warn', message: 'private keys may not be gitignored — check .gitignore' });
    }
  } else {
    checks.push({ name: '.gitignore', status: 'warn', message: '.gitignore not found — ensure private keys are not committed' });
  }

  return checks;
}

export function formatDoctorOutput(checks: DoctorCheck[]): string {
  const icons = { ok: '✔', warn: '⚠', error: '✖' };
  const lines = checks.map(c => `  ${icons[c.status]} [${c.status.toUpperCase()}] ${c.name}: ${c.message}`);
  const hasError = checks.some(c => c.status === 'error');
  const hasWarn = checks.some(c => c.status === 'warn');
  const summary = hasError ? 'Issues found. Please resolve errors before using envault.'
    : hasWarn ? 'Warnings detected. Review recommendations above.'
    : 'All checks passed. Your envault setup looks healthy.';
  return lines.join('\n') + '\n\n' + summary;
}

export async function runDoctor(): Promise<void> {
  console.log('Running envault diagnostics...\n');
  const checks = await runDoctorChecks();
  console.log(formatDoctorOutput(checks));
  const hasError = checks.some(c => c.status === 'error');
  if (hasError) process.exit(1);
}
