import * as fs from 'fs';
import * as path from 'path';

const QUOTA_FILE = '.envault/quota.json';

export interface QuotaConfig {
  maxKeys?: number;
  maxValueLength?: number;
  maxVaultSizeBytes?: number;
}

export interface QuotaStatus {
  keyCount: number;
  vaultSizeBytes: number;
  maxValueLengthFound: number;
  violations: string[];
}

export function loadQuota(): QuotaConfig {
  if (!fs.existsSync(QUOTA_FILE)) return {};
  return JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
}

export function saveQuota(config: QuotaConfig): void {
  const dir = path.dirname(QUOTA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(config, null, 2));
}

export function checkQuota(
  vault: Record<string, string>,
  config: QuotaConfig
): QuotaStatus {
  const keys = Object.keys(vault);
  const vaultJson = JSON.stringify(vault);
  const vaultSizeBytes = Buffer.byteLength(vaultJson, 'utf-8');
  const maxValueLengthFound = keys.reduce((max, k) => {
    return Math.max(max, (vault[k] || '').length);
  }, 0);

  const violations: string[] = [];

  if (config.maxKeys !== undefined && keys.length > config.maxKeys) {
    violations.push(`Key count ${keys.length} exceeds limit of ${config.maxKeys}`);
  }
  if (config.maxVaultSizeBytes !== undefined && vaultSizeBytes > config.maxVaultSizeBytes) {
    violations.push(`Vault size ${vaultSizeBytes}B exceeds limit of ${config.maxVaultSizeBytes}B`);
  }
  if (config.maxValueLength !== undefined) {
    for (const k of keys) {
      if ((vault[k] || '').length > config.maxValueLength) {
        violations.push(`Value for '${k}' exceeds max length of ${config.maxValueLength}`);
      }
    }
  }

  return { keyCount: keys.length, vaultSizeBytes, maxValueLengthFound, violations };
}

export function runQuota(
  action: 'get' | 'set' | 'check',
  vault: Record<string, string>,
  updates?: Partial<QuotaConfig>
): void {
  if (action === 'set' && updates) {
    const existing = loadQuota();
    const merged = { ...existing, ...updates };
    saveQuota(merged);
    console.log('Quota configuration updated.');
    return;
  }

  const config = loadQuota();

  if (action === 'get') {
    if (Object.keys(config).length === 0) {
      console.log('No quota limits configured.');
    } else {
      console.log('Current quota limits:');
      if (config.maxKeys !== undefined) console.log(`  maxKeys: ${config.maxKeys}`);
      if (config.maxValueLength !== undefined) console.log(`  maxValueLength: ${config.maxValueLength}`);
      if (config.maxVaultSizeBytes !== undefined) console.log(`  maxVaultSizeBytes: ${config.maxVaultSizeBytes}`);
    }
    return;
  }

  const status = checkQuota(vault, config);
  console.log(`Keys: ${status.keyCount}, Vault size: ${status.vaultSizeBytes}B, Max value length: ${status.maxValueLengthFound}`);
  if (status.violations.length === 0) {
    console.log('✓ All quota checks passed.');
  } else {
    console.log('✗ Quota violations:');
    status.violations.forEach(v => console.log(`  - ${v}`));
    process.exit(1);
  }
}
