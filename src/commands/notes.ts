import fs from 'fs';
import path from 'path';

const NOTES_FILE = '.envault/notes.json';

export interface NoteEntry {
  key: string;
  note: string;
  updatedAt: string;
  author?: string;
}

export type NotesMap = Record<string, NoteEntry>;

export function loadNotes(): NotesMap {
  if (!fs.existsSync(NOTES_FILE)) return {};
  try {
    const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
    return JSON.parse(raw) as NotesMap;
  } catch {
    return {};
  }
}

export function saveNotes(notes: NotesMap): void {
  const dir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
}

export function setNote(key: string, note: string, author?: string): void {
  const notes = loadNotes();
  notes[key] = {
    key,
    note,
    updatedAt: new Date().toISOString(),
    ...(author ? { author } : {}),
  };
  saveNotes(notes);
}

export function removeNote(key: string): boolean {
  const notes = loadNotes();
  if (!notes[key]) return false;
  delete notes[key];
  saveNotes(notes);
  return true;
}

export function getNote(key: string): NoteEntry | undefined {
  return loadNotes()[key];
}

export function runNotes(
  action: 'set' | 'get' | 'remove' | 'list',
  key?: string,
  note?: string,
  author?: string
): void {
  if (action === 'list') {
    const notes = loadNotes();
    const entries = Object.values(notes);
    if (entries.length === 0) {
      console.log('No notes found.');
      return;
    }
    entries.forEach((e) => {
      console.log(`[${e.key}] ${e.note}${e.author ? ` (by ${e.author})` : ''} — ${e.updatedAt}`);
    });
    return;
  }

  if (!key) {
    console.error('Key is required.');
    process.exit(1);
  }

  if (action === 'set') {
    if (!note) { console.error('Note text is required.'); process.exit(1); }
    setNote(key, note, author);
    console.log(`Note set for "${key}".`);
  } else if (action === 'get') {
    const entry = getNote(key);
    if (!entry) { console.log(`No note found for "${key}".`); return; }
    console.log(`[${entry.key}] ${entry.note}${entry.author ? ` (by ${entry.author})` : ''} — ${entry.updatedAt}`);
  } else if (action === 'remove') {
    const removed = removeNote(key);
    console.log(removed ? `Note removed for "${key}".` : `No note found for "${key}".`);
  }
}
