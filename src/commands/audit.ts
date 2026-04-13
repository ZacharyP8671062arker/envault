import * as fs from 'fs';
import * as path from 'path';

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  target?: string;
  details?: string;
}

const AUDIT_LOG_PATH = path.join(process.cwd(), '.envault', 'audit.log');

export function appendAuditEntry(entry: AuditEntry): void {
  const dir = path.dirname(AUDIT_LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf-8');
}

export function readAuditLog(): AuditEntry[] {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function clearAuditLog(): void {
  if (fs.existsSync(AUDIT_LOG_PATH)) {
    fs.writeFileSync(AUDIT_LOG_PATH, '', 'utf-8');
  }
}

export function runAudit(options: { user?: string; action?: string; limit?: number }): void {
  let entries = readAuditLog();

  if (options.user) {
    entries = entries.filter((e) => e.user === options.user);
  }
  if (options.action) {
    entries = entries.filter((e) => e.action === options.action);
  }
  if (options.limit && options.limit > 0) {
    entries = entries.slice(-options.limit);
  }

  if (entries.length === 0) {
    console.log('No audit entries found.');
    return;
  }

  console.log(`\nAudit Log (${entries.length} entries):\n`);
  for (const entry of entries) {
    const target = entry.target ? ` -> ${entry.target}` : '';
    const details = entry.details ? ` (${entry.details})` : '';
    console.log(`[${entry.timestamp}] ${entry.action} by ${entry.user}${target}${details}`);
  }
}
