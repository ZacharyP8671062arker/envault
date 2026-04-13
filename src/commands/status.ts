import * as fs from 'fs';
import * as path from 'path';

export interface VaultStatus {
  initialized: boolean;
  hasPublicKey: boolean;
  hasPrivateKey: boolean;
  isLocked: boolean;
  vaultExists: boolean;
  sharedUsers: string[];
  secretCount: number;
  auditEntryCount: number;
}

export function getVaultStatus(vaultDir: string = '.envault'): VaultStatus {
  const initialized = fs.existsSync(vaultDir);
  const hasPublicKey = fs.existsSync(path.join(vaultDir, 'public.pem'));
  const hasPrivateKey = fs.existsSync(path.join(vaultDir, 'private.pem'));
  const isLocked = fs.existsSync(path.join(vaultDir, 'private.pem.locked'));
  const vaultPath = path.join(vaultDir, 'vault.json');
  const vaultExists = fs.existsSync(vaultPath);

  let secretCount = 0;
  if (vaultExists) {
    try {
      const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
      secretCount = Object.keys(vault.secrets || {}).length;
    } catch {
      secretCount = 0;
    }
  }

  const sharedDir = path.join(vaultDir, 'shared');
  let sharedUsers: string[] = [];
  if (fs.existsSync(sharedDir)) {
    sharedUsers = fs.readdirSync(sharedDir)
      .filter(f => f.endsWith('.pem'))
      .map(f => f.replace('.pem', ''));
  }

  const auditPath = path.join(vaultDir, 'audit.log');
  let auditEntryCount = 0;
  if (fs.existsSync(auditPath)) {
    const lines = fs.readFileSync(auditPath, 'utf-8').trim().split('\n');
    auditEntryCount = lines.filter(l => l.trim().length > 0).length;
  }

  return {
    initialized,
    hasPublicKey,
    hasPrivateKey,
    isLocked,
    vaultExists,
    sharedUsers,
    secretCount,
    auditEntryCount,
  };
}

export function runStatus(vaultDir: string = '.envault'): void {
  const status = getVaultStatus(vaultDir);

  console.log('envault status');
  console.log('==============');
  console.log(`Initialized:    ${status.initialized ? '✔' : '✘'}`);
  console.log(`Public key:     ${status.hasPublicKey ? '✔' : '✘'}`);
  console.log(`Private key:    ${status.hasPrivateKey ? '✔' : (status.isLocked ? '🔒 locked' : '✘')}`);
  console.log(`Vault file:     ${status.vaultExists ? '✔' : '✘'}`);
  console.log(`Secrets:        ${status.secretCount}`);
  console.log(`Shared with:    ${status.sharedUsers.length > 0 ? status.sharedUsers.join(', ') : 'nobody'}`);
  console.log(`Audit entries:  ${status.auditEntryCount}`);
}
