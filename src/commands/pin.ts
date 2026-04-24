import * as fs from 'fs';
import * as path from 'path';

const PINS_FILE = '.envault/pins.json';

export interface PinEntry {
  key: string;
  note?: string;
  pinnedAt: string;
}

export function loadPins(): PinEntry[] {
  if (!fs.existsSync(PINS_FILE)) return [];
  try {
    const raw = fs.readFileSync(PINS_FILE, 'utf-8');
    return JSON.parse(raw) as PinEntry[];
  } catch {
    return [];
  }
}

export function savePins(pins: PinEntry[]): void {
  const dir = path.dirname(PINS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2), 'utf-8');
}

export function pinKey(key: string, note?: string): boolean {
  const pins = loadPins();
  if (pins.some((p) => p.key === key)) return false;
  pins.push({ key, note, pinnedAt: new Date().toISOString() });
  savePins(pins);
  return true;
}

export function unpinKey(key: string): boolean {
  const pins = loadPins();
  const index = pins.findIndex((p) => p.key === key);
  if (index === -1) return false;
  pins.splice(index, 1);
  savePins(pins);
  return true;
}

export function isPinned(key: string): boolean {
  return loadPins().some((p) => p.key === key);
}

export function runPin(args: string[]): void {
  const [subcommand, key, ...rest] = args;

  if (subcommand === 'add' && key) {
    const note = rest.join(' ') || undefined;
    const added = pinKey(key, note);
    if (added) {
      console.log(`Pinned key: ${key}${note ? ` (${note})` : ''}`);
    } else {
      console.log(`Key "${key}" is already pinned.`);
    }
  } else if (subcommand === 'remove' && key) {
    const removed = unpinKey(key);
    if (removed) {
      console.log(`Unpinned key: ${key}`);
    } else {
      console.log(`Key "${key}" was not pinned.`);
    }
  } else if (subcommand === 'list' || !subcommand) {
    const pins = loadPins();
    if (pins.length === 0) {
      console.log('No pinned keys.');
    } else {
      console.log('Pinned keys:');
      for (const p of pins) {
        const noteStr = p.note ? `  # ${p.note}` : '';
        console.log(`  ${p.key}${noteStr}  (pinned ${p.pinnedAt})`);
      }
    }
  } else {
    console.error('Usage: envault pin <add|remove|list> [key] [note]');
    process.exit(1);
  }
}
