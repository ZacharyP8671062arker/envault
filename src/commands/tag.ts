import * as fs from 'fs';
import * as path from 'path';

const VAULT_DIR = '.envault';
const TAGS_FILE = path.join(VAULT_DIR, 'tags.json');

export interface TagMap {
  [tag: string]: string[]; // tag -> list of vault entry keys
}

export function loadTags(): TagMap {
  if (!fs.existsSync(TAGS_FILE)) return {};
  const raw = fs.readFileSync(TAGS_FILE, 'utf-8');
  return JSON.parse(raw) as TagMap;
}

export function saveTags(tags: TagMap): void {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2), 'utf-8');
}

export function addTag(tag: string, key: string): void {
  const tags = loadTags();
  if (!tags[tag]) tags[tag] = [];
  if (!tags[tag].includes(key)) {
    tags[tag].push(key);
  }
  saveTags(tags);
}

export function removeTag(tag: string, key: string): void {
  const tags = loadTags();
  if (!tags[tag]) return;
  tags[tag] = tags[tag].filter((k) => k !== key);
  if (tags[tag].length === 0) delete tags[tag];
  saveTags(tags);
}

export function getKeysByTag(tag: string): string[] {
  const tags = loadTags();
  return tags[tag] ?? [];
}

export function getTagsForKey(key: string): string[] {
  const tags = loadTags();
  return Object.entries(tags)
    .filter(([, keys]) => keys.includes(key))
    .map(([tag]) => tag);
}

export function runTag(args: string[]): void {
  const [subcommand, tag, key] = args;
  if (subcommand === 'add' && tag && key) {
    addTag(tag, key);
    console.log(`Tagged '${key}' with '${tag}'.`);
  } else if (subcommand === 'remove' && tag && key) {
    removeTag(tag, key);
    console.log(`Removed tag '${tag}' from '${key}'.`);
  } else if (subcommand === 'list' && tag) {
    const keys = getKeysByTag(tag);
    if (keys.length === 0) {
      console.log(`No keys tagged with '${tag}'.`);
    } else {
      console.log(`Keys tagged '${tag}':\n${keys.map((k) => `  - ${k}`).join('\n')}`);
    }
  } else {
    console.error('Usage: envault tag <add|remove|list> <tag> [key]');
    process.exit(1);
  }
}
