import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot, listSnapshots } from './snapshot';
import { saveVault, loadVault } from './add';
import { logAction } from '../crypto/auditLogger';

export interface RollbackResult {
  success: boolean;
  snapshotId: string;
  keysRestored: number;
  message: string;
}

export async function rollbackToSnapshot(
  vaultPath: string,
  snapshotId: string
): Promise<RollbackResult> {
  const snapshots = await listSnapshots(vaultPath);
  const match = snapshots.find((s) => s.id === snapshotId || s.id.startsWith(snapshotId));

  if (!match) {
    return {
      success: false,
      snapshotId,
      keysRestored: 0,
      message: `Snapshot '${snapshotId}' not found.`,
    };
  }

  const snapshot = await loadSnapshot(vaultPath, match.id);

  if (!snapshot || !snapshot.vault) {
    return {
      success: false,
      snapshotId: match.id,
      keysRestored: 0,
      message: `Failed to load snapshot data for '${match.id}'.`,
    };
  }

  await saveVault(vaultPath, snapshot.vault);

  const keysRestored = Object.keys(snapshot.vault).length;

  await logAction('rollback', {
    snapshotId: match.id,
    keysRestored,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    snapshotId: match.id,
    keysRestored,
    message: `Vault rolled back to snapshot '${match.id}' (${keysRestored} keys restored).`,
  };
}

export async function runRollback(vaultPath: string, snapshotId: string): Promise<void> {
  if (!snapshotId) {
    console.error('Error: snapshot ID is required.');
    process.exit(1);
  }

  const result = await rollbackToSnapshot(vaultPath, snapshotId);

  if (!result.success) {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }

  console.log(result.message);
}
