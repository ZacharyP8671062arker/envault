import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOTS_DIR = '.envault/snapshots';

export interface Snapshot {
  id: string;
  label: string;
  timestamp: string;
  vault: Record<string, string>;
}

export function ensureSnapshotsDir(): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

export function createSnapshot(vault: Record<string, string>, label: string): Snapshot {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const snapshot: Snapshot = {
    id,
    label,
    timestamp: new Date().toISOString(),
    vault,
  };
  ensureSnapshotsDir();
  const filePath = path.join(SNAPSHOTS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return snapshot;
}

export function listSnapshots(): Snapshot[] {
  ensureSnapshotsDir();
  const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR, f), 'utf-8')) as Snapshot)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function loadSnapshot(id: string): Snapshot | null {
  const filePath = path.join(SNAPSHOTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Snapshot;
}

export function deleteSnapshot(id: string): boolean {
  const filePath = path.join(SNAPSHOTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function runSnapshot(args: string[]): void {
  const subcommand = args[0];
  if (subcommand === 'create') {
    const label = args[1] || 'unnamed';
    const vaultPath = '.envault/vault.json';
    if (!fs.existsSync(vaultPath)) {
      console.error('No vault found. Run envault init first.');
      process.exit(1);
    }
    const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    const snap = createSnapshot(vault, label);
    console.log(`Snapshot created: ${snap.id} ("${snap.label}")`);
  } else if (subcommand === 'list') {
    const snaps = listSnapshots();
    if (snaps.length === 0) {
      console.log('No snapshots found.');
      return;
    }
    snaps.forEach(s => console.log(`${s.id}  ${s.timestamp}  ${s.label}`));
  } else if (subcommand === 'delete') {
    const id = args[1];
    if (!id) { console.error('Provide a snapshot id.'); process.exit(1); }
    const ok = deleteSnapshot(id);
    console.log(ok ? `Deleted snapshot ${id}.` : `Snapshot ${id} not found.`);
  } else {
    console.error('Usage: envault snapshot <create|list|delete> [args]');
    process.exit(1);
  }
}
