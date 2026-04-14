import * as fs from 'fs';
import * as path from 'path';
import {
  createSnapshot,
  listSnapshots,
  loadSnapshot,
  deleteSnapshot,
  ensureSnapshotsDir,
} from './snapshot';

const SNAPSHOTS_DIR = '.envault/snapshots';

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
});

describe('ensureSnapshotsDir', () => {
  it('creates the directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    ensureSnapshotsDir();
    expect(fs.mkdirSync).toHaveBeenCalledWith(SNAPSHOTS_DIR, { recursive: true });
  });

  it('does not create if already exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    ensureSnapshotsDir();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
});

describe('createSnapshot', () => {
  it('writes a snapshot file and returns the snapshot', () => {
    const writeFileSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const vault = { API_KEY: 'enc_abc', DB_URL: 'enc_xyz' };
    const snap = createSnapshot(vault, 'before-deploy');
    expect(snap.label).toBe('before-deploy');
    expect(snap.vault).toEqual(vault);
    expect(snap.id).toBeTruthy();
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(SNAPSHOTS_DIR, `${snap.id}.json`),
      expect.any(String),
      'utf-8'
    );
  });
});

describe('listSnapshots', () => {
  it('returns snapshots sorted by timestamp', () => {
    const snap1 = { id: 'a', label: 'first', timestamp: '2024-01-01T00:00:00.000Z', vault: {} };
    const snap2 = { id: 'b', label: 'second', timestamp: '2024-06-01T00:00:00.000Z', vault: {} };
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['b.json', 'a.json'] as any);
    jest.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
      if (p.includes('a.json')) return JSON.stringify(snap1);
      return JSON.stringify(snap2);
    });
    const result = listSnapshots();
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('b');
  });

  it('returns empty array when no snapshots', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([] as any);
    expect(listSnapshots()).toEqual([]);
  });
});

describe('loadSnapshot', () => {
  it('returns null if snapshot does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(loadSnapshot('nonexistent')).toBeNull();
  });

  it('returns the snapshot if it exists', () => {
    const snap = { id: 'abc', label: 'test', timestamp: '2024-01-01T00:00:00.000Z', vault: {} };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(snap) as any);
    expect(loadSnapshot('abc')).toEqual(snap);
  });
});

describe('deleteSnapshot', () => {
  it('returns false if snapshot does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(deleteSnapshot('missing')).toBe(false);
  });

  it('deletes and returns true if snapshot exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    expect(deleteSnapshot('abc')).toBe(true);
    expect(unlinkSpy).toHaveBeenCalled();
  });
});
