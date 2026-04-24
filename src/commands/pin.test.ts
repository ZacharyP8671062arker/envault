import * as fs from 'fs';
import * as path from 'path';
import {
  loadPins,
  savePins,
  pinKey,
  unpinKey,
  isPinned,
  PinEntry,
} from './pin';

const PINS_FILE = '.envault/pins.json';

beforeEach(() => {
  if (fs.existsSync(PINS_FILE)) fs.unlinkSync(PINS_FILE);
});

afterEach(() => {
  if (fs.existsSync(PINS_FILE)) fs.unlinkSync(PINS_FILE);
});

describe('loadPins', () => {
  it('returns empty array when file does not exist', () => {
    expect(loadPins()).toEqual([]);
  });

  it('returns parsed pins from file', () => {
    const pins: PinEntry[] = [
      { key: 'API_KEY', pinnedAt: '2024-01-01T00:00:00.000Z' },
    ];
    fs.mkdirSync(path.dirname(PINS_FILE), { recursive: true });
    fs.writeFileSync(PINS_FILE, JSON.stringify(pins), 'utf-8');
    expect(loadPins()).toEqual(pins);
  });

  it('returns empty array on malformed JSON', () => {
    fs.mkdirSync(path.dirname(PINS_FILE), { recursive: true });
    fs.writeFileSync(PINS_FILE, 'not-json', 'utf-8');
    expect(loadPins()).toEqual([]);
  });
});

describe('pinKey', () => {
  it('pins a new key and returns true', () => {
    const result = pinKey('DB_URL', 'critical');
    expect(result).toBe(true);
    const pins = loadPins();
    expect(pins).toHaveLength(1);
    expect(pins[0].key).toBe('DB_URL');
    expect(pins[0].note).toBe('critical');
  });

  it('returns false if key is already pinned', () => {
    pinKey('DB_URL');
    const result = pinKey('DB_URL');
    expect(result).toBe(false);
    expect(loadPins()).toHaveLength(1);
  });

  it('pins multiple distinct keys', () => {
    pinKey('KEY_A');
    pinKey('KEY_B');
    expect(loadPins()).toHaveLength(2);
  });
});

describe('unpinKey', () => {
  it('removes a pinned key and returns true', () => {
    pinKey('SECRET');
    const result = unpinKey('SECRET');
    expect(result).toBe(true);
    expect(loadPins()).toHaveLength(0);
  });

  it('returns false if key was not pinned', () => {
    const result = unpinKey('NONEXISTENT');
    expect(result).toBe(false);
  });
});

describe('isPinned', () => {
  it('returns true for a pinned key', () => {
    pinKey('PINNED_KEY');
    expect(isPinned('PINNED_KEY')).toBe(true);
  });

  it('returns false for an unpinned key', () => {
    expect(isPinned('UNPINNED_KEY')).toBe(false);
  });
});
