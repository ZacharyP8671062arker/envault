import * as fs from 'fs';

const AUDIT_LOG_PATH = '.envault/audit.log';

export interface AuditEntry {
  action: string;
  actor: string;
  target?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export function logAction(entry: Omit<AuditEntry, 'timestamp'>): void {
  const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
  const line = JSON.stringify(full) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf-8');
}

export function logPush(actor: string, keyCount: number): void {
  logAction({ action: 'push', actor, meta: { keyCount } });
}

export function logPull(actor: string, keyCount: number): void {
  logAction({ action: 'pull', actor, meta: { keyCount } });
}

export function logShare(actor: string, target: string): void {
  logAction({ action: 'share', actor, target });
}

export function logUnshare(actor: string, target: string): void {
  logAction({ action: 'unshare', actor, target });
}

export function logSnapshot(actor: string, snapshotId: string, label: string): void {
  logAction({ action: 'snapshot', actor, meta: { snapshotId, label } });
}

export function logSnapshotDelete(actor: string, snapshotId: string): void {
  logAction({ action: 'snapshot_delete', actor, meta: { snapshotId } });
}

export function readAuditEntries(): AuditEntry[] {
  if (!fs.existsSync(AUDIT_LOG_PATH)) return [];
  return fs
    .readFileSync(AUDIT_LOG_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as AuditEntry);
}
