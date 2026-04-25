import * as fs from 'fs';
import * as path from 'path';
import { loadSchema } from './schema';
import { loadVault } from './add';

export interface ValidationResult {
  key: string;
  valid: boolean;
  reason?: string;
}

export function parseEnvFileToMap(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    result[key] = value;
  }
  return result;
}

export function validateEnvAgainstSchema(
  envMap: Record<string, string>,
  schemaDir: string
): ValidationResult[] {
  const schema = loadSchema(schemaDir);
  const results: ValidationResult[] = [];

  for (const [key, field] of Object.entries(schema)) {
    const value = envMap[key];
    if (field.required && (value === undefined || value === '')) {
      results.push({ key, valid: false, reason: 'Required key is missing or empty' });
      continue;
    }
    if (value === undefined) {
      results.push({ key, valid: true });
      continue;
    }
    if (field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        results.push({ key, valid: false, reason: `Value does not match pattern: ${field.pattern}` });
        continue;
      }
    }
    if (field.type === 'number' && isNaN(Number(value))) {
      results.push({ key, valid: false, reason: 'Expected a numeric value' });
      continue;
    }
    if (field.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      results.push({ key, valid: false, reason: 'Expected a boolean value (true/false/1/0)' });
      continue;
    }
    results.push({ key, valid: true });
  }

  return results;
}

export function runEnvValidate(envFilePath: string, vaultDir: string): void {
  const schemaDir = vaultDir;
  let envMap: Record<string, string>;
  try {
    envMap = parseEnvFileToMap(envFilePath);
  } catch (e: any) {
    console.error(`Error reading env file: ${e.message}`);
    process.exit(1);
  }

  const results = validateEnvAgainstSchema(envMap, schemaDir);
  if (results.length === 0) {
    console.log('No schema defined. Nothing to validate.');
    return;
  }

  let hasErrors = false;
  for (const r of results) {
    if (!r.valid) {
      console.error(`  ✗ ${r.key}: ${r.reason}`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${r.key}`);
    }
  }

  if (hasErrors) {
    console.error('\nValidation failed.');
    process.exit(1);
  } else {
    console.log('\nAll checks passed.');
  }
}
