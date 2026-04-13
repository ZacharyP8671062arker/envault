import * as fs from 'fs';
import * as path from 'path';
import {
  loadTags,
  saveTags,
  addTag,
  removeTag,
  getKeysByTag,
  getTagsForKey,
} from './tag';

const VAULT_DIR = '.envault';
const TAGS_FILE = path.join(VAULT_DIR, 'tags.json');

beforeEach(() => {
  if (fs.existsSync(TAGS_FILE)) fs.unlinkSync(TAGS_FILE);
});

afterAll(() => {
  if (fs.existsSync(TAGS_FILE)) fs.unlinkSync(TAGS_FILE);
});

describe('loadTags', () => {
  it('returns empty object when no tags file exists', () => {
    expect(loadTags()).toEqual({});
  });

  it('returns parsed tags from file', () => {
    if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
    fs.writeFileSync(TAGS_FILE, JSON.stringify({ prod: ['DB_URL'] }), 'utf-8');
    expect(loadTags()).toEqual({ prod: ['DB_URL'] });
  });
});

describe('saveTags', () => {
  it('writes tags to file', () => {
    saveTags({ staging: ['API_KEY'] });
    const raw = fs.readFileSync(TAGS_FILE, 'utf-8');
    expect(JSON.parse(raw)).toEqual({ staging: ['API_KEY'] });
  });
});

describe('addTag', () => {
  it('adds a key to a new tag', () => {
    addTag('prod', 'DB_URL');
    expect(loadTags()).toEqual({ prod: ['DB_URL'] });
  });

  it('does not duplicate keys under the same tag', () => {
    addTag('prod', 'DB_URL');
    addTag('prod', 'DB_URL');
    expect(loadTags()['prod']).toHaveLength(1);
  });

  it('adds multiple keys to the same tag', () => {
    addTag('prod', 'DB_URL');
    addTag('prod', 'API_KEY');
    expect(loadTags()['prod']).toEqual(['DB_URL', 'API_KEY']);
  });
});

describe('removeTag', () => {
  it('removes a key from a tag', () => {
    addTag('prod', 'DB_URL');
    removeTag('prod', 'DB_URL');
    expect(loadTags()).toEqual({});
  });

  it('does nothing when tag does not exist', () => {
    expect(() => removeTag('nonexistent', 'DB_URL')).not.toThrow();
  });

  it('keeps other keys when removing one', () => {
    addTag('prod', 'DB_URL');
    addTag('prod', 'API_KEY');
    removeTag('prod', 'DB_URL');
    expect(loadTags()['prod']).toEqual(['API_KEY']);
  });
});

describe('getKeysByTag', () => {
  it('returns keys for a given tag', () => {
    addTag('prod', 'DB_URL');
    expect(getKeysByTag('prod')).toContain('DB_URL');
  });

  it('returns empty array for unknown tag', () => {
    expect(getKeysByTag('unknown')).toEqual([]);
  });
});

describe('getTagsForKey', () => {
  it('returns all tags associated with a key', () => {
    addTag('prod', 'DB_URL');
    addTag('critical', 'DB_URL');
    const tags = getTagsForKey('DB_URL');
    expect(tags).toContain('prod');
    expect(tags).toContain('critical');
  });

  it('returns empty array when key has no tags', () => {
    expect(getTagsForKey('UNTAGGED_KEY')).toEqual([]);
  });
});
