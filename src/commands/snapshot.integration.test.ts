import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createSnapshot, listSnapshots, loadSnapshot, deleteSnapshot } from './snapshot';

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-'));
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('snapshot integration', () => {
  it('creates and retrieves a snapshot', () => {
    const vault = { SECRET: 'enc_abc123', TOKEN: 'enc_xyz456' };
    const snap = createSnapshot(vault, 'integration-test');
    expect(snap.id).toBeTruthy();
    const loaded = loadSnapshot(snap.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.label).toBe('integration-test');
    expect(loaded!.vault).toEqual(vault);
  });

  it('lists multiple snapshots in order', () => {
    createSnapshot({ A: '1' }, 'first');
    createSnapshot({ B: '2' }, 'second');
    createSnapshot({ C: '3' }, 'third');
    const snaps = listSnapshots();
    expect(snaps.length).toBe(3);
    const labels = snaps.map(s => s.label);
    expect(labels).toContain('first');
    expect(labels).toContain('second');
    expect(labels).toContain('third');
  });

  it('deletes a snapshot', () => {
    const snap = createSnapshot({ KEY: 'val' }, 'to-delete');
    expect(deleteSnapshot(snap.id)).toBe(true);
    expect(loadSnapshot(snap.id)).toBeNull();
    const remaining = listSnapshots();
    expect(remaining.find(s => s.id === snap.id)).toBeUndefined();
  });

  it('returns false when deleting non-existent snapshot', () => {
    expect(deleteSnapshot('does-not-exist')).toBe(false);
  });
});
