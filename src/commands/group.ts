import * as fs from 'fs';
import * as path from 'path';

const GROUPS_FILE = '.envault/groups.json';

export interface GroupMap {
  [groupName: string]: string[];
}

export function loadGroups(): GroupMap {
  if (!fs.existsSync(GROUPS_FILE)) return {};
  const raw = fs.readFileSync(GROUPS_FILE, 'utf-8');
  return JSON.parse(raw) as GroupMap;
}

export function saveGroups(groups: GroupMap): void {
  const dir = path.dirname(GROUPS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2), 'utf-8');
}

export function createGroup(name: string): void {
  const groups = loadGroups();
  if (groups[name]) throw new Error(`Group "${name}" already exists.`);
  groups[name] = [];
  saveGroups(groups);
  console.log(`Group "${name}" created.`);
}

export function deleteGroup(name: string): void {
  const groups = loadGroups();
  if (!groups[name]) throw new Error(`Group "${name}" does not exist.`);
  delete groups[name];
  saveGroups(groups);
  console.log(`Group "${name}" deleted.`);
}

export function addKeyToGroup(groupName: string, key: string): void {
  const groups = loadGroups();
  if (!groups[groupName]) throw new Error(`Group "${groupName}" does not exist.`);
  if (groups[groupName].includes(key)) {
    console.log(`Key "${key}" is already in group "${groupName}".`);
    return;
  }
  groups[groupName].push(key);
  saveGroups(groups);
  console.log(`Key "${key}" added to group "${groupName}".`);
}

export function removeKeyFromGroup(groupName: string, key: string): void {
  const groups = loadGroups();
  if (!groups[groupName]) throw new Error(`Group "${groupName}" does not exist.`);
  const idx = groups[groupName].indexOf(key);
  if (idx === -1) throw new Error(`Key "${key}" not found in group "${groupName}".`);
  groups[groupName].splice(idx, 1);
  saveGroups(groups);
  console.log(`Key "${key}" removed from group "${groupName}".`);
}

export function getKeysInGroup(groupName: string): string[] {
  const groups = loadGroups();
  if (!groups[groupName]) throw new Error(`Group "${groupName}" does not exist.`);
  return groups[groupName];
}

export function listGroups(): string[] {
  return Object.keys(loadGroups());
}

export function runGroup(args: string[]): void {
  const [subcommand, ...rest] = args;
  switch (subcommand) {
    case 'create': createGroup(rest[0]); break;
    case 'delete': deleteGroup(rest[0]); break;
    case 'add': addKeyToGroup(rest[0], rest[1]); break;
    case 'remove': removeKeyFromGroup(rest[0], rest[1]); break;
    case 'list': {
      if (rest[0]) {
        const keys = getKeysInGroup(rest[0]);
        console.log(keys.length ? keys.join('\n') : `(no keys in group "${rest[0]}")`);
      } else {
        const groups = listGroups();
        console.log(groups.length ? groups.join('\n') : '(no groups defined)');
      }
      break;
    }
    default:
      console.error('Usage: envault group <create|delete|add|remove|list> [groupName] [key]');
  }
}
