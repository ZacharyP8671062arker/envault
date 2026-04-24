import fs from 'fs';
import { loadNotes, saveNotes, setNote, removeNote, getNote, runNotes, NotesMap } from './notes';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const sampleNotes: NotesMap = {
  API_KEY: {
    key: 'API_KEY',
    note: 'Used for external API access',
    updatedAt: '2024-01-01T00:00:00.000Z',
    author: 'alice',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleNotes));
  mockFs.writeFileSync.mockImplementation(() => {});
  mockFs.mkdirSync.mockImplementation(() => undefined);
});

describe('loadNotes', () => {
  it('returns parsed notes from file', () => {
    const notes = loadNotes();
    expect(notes['API_KEY'].note).toBe('Used for external API access');
  });

  it('returns empty object if file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(loadNotes()).toEqual({});
  });

  it('returns empty object on parse error', () => {
    mockFs.readFileSync.mockReturnValue('invalid json');
    expect(loadNotes()).toEqual({});
  });
});

describe('setNote', () => {
  it('adds a note for a key', () => {
    setNote('DB_URL', 'Database connection string', 'bob');
    const written = JSON.parse((mockFs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(written['DB_URL'].note).toBe('Database connection string');
    expect(written['DB_URL'].author).toBe('bob');
  });

  it('overwrites existing note', () => {
    setNote('API_KEY', 'Updated note');
    const written = JSON.parse((mockFs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(written['API_KEY'].note).toBe('Updated note');
  });
});

describe('removeNote', () => {
  it('removes an existing note and returns true', () => {
    const result = removeNote('API_KEY');
    expect(result).toBe(true);
    const written = JSON.parse((mockFs.writeFileSync as jest.Mock).mock.calls[0][1]);
    expect(written['API_KEY']).toBeUndefined();
  });

  it('returns false if note does not exist', () => {
    expect(removeNote('NONEXISTENT')).toBe(false);
  });
});

describe('getNote', () => {
  it('returns note entry for existing key', () => {
    const entry = getNote('API_KEY');
    expect(entry?.note).toBe('Used for external API access');
  });

  it('returns undefined for missing key', () => {
    expect(getNote('MISSING')).toBeUndefined();
  });
});

describe('runNotes', () => {
  it('lists all notes', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runNotes('list');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    spy.mockRestore();
  });

  it('prints message when no notes exist on list', () => {
    mockFs.existsSync.mockReturnValue(false);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runNotes('list');
    expect(spy).toHaveBeenCalledWith('No notes found.');
    spy.mockRestore();
  });

  it('exits with error if key missing on set', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runNotes('set')).toThrow('exit');
    exitSpy.mockRestore();
  });
});
