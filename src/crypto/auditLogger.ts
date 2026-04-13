import { appendAuditEntry, AuditEntry } from '../commands/audit';

export type AuditAction =
  | 'init'
  | 'push'
  | 'pull'
  | 'share'
  | 'unshare'
  | 'revoke'
  | 'rotate'
  | 'export'
  | 'list';

export function logAction(
  action: AuditAction,
  user: string,
  target?: string,
  details?: string
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    user,
    ...(target !== undefined && { target }),
    ...(details !== undefined && { details }),
  };
  appendAuditEntry(entry);
}

export function logPush(user: string, key: string): void {
  logAction('push', user, key, 'secret pushed to vault');
}

export function logPull(user: string, key: string): void {
  logAction('pull', user, key, 'secret pulled from vault');
}

export function logShare(owner: string, recipient: string): void {
  logAction('share', owner, recipient, 'vault shared with user');
}

export function logUnshare(owner: string, recipient: string): void {
  logAction('unshare', owner, recipient, 'vault access revoked from user');
}

export function logRotate(user: string): void {
  logAction('rotate', user, undefined, 'key pair rotated');
}

export function logExport(user: string, outputPath: string): void {
  logAction('export', user, outputPath, 'vault exported to env file');
}
