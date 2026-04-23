import * as fs from 'fs';
import * as path from 'path';
import { loadVault } from './add';

export interface Template {
  name: string;
  keys: string[];
  description?: string;
  createdAt: string;
}

const TEMPLATES_FILE = '.envault/templates.json';

export function loadTemplates(): Record<string, Template> {
  if (!fs.existsSync(TEMPLATES_FILE)) return {};
  const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveTemplates(templates: Record<string, Template>): void {
  const dir = path.dirname(TEMPLATES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

export function createTemplate(name: string, keys: string[], description?: string): Template {
  const templates = loadTemplates();
  if (templates[name]) {
    throw new Error(`Template "${name}" already exists. Use --force to overwrite.`);
  }
  const template: Template = {
    name,
    keys,
    description,
    createdAt: new Date().toISOString(),
  };
  templates[name] = template;
  saveTemplates(templates);
  return template;
}

export function deleteTemplate(name: string): void {
  const templates = loadTemplates();
  if (!templates[name]) {
    throw new Error(`Template "${name}" not found.`);
  }
  delete templates[name];
  saveTemplates(templates);
}

export function applyTemplate(templateName: string): string[] {
  const templates = loadTemplates();
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" not found.`);
  }
  const vault = loadVault();
  const missing = template.keys.filter((k) => !(k in vault));
  if (missing.length > 0) {
    console.warn(`Warning: the following keys from template are not in vault: ${missing.join(', ')}`);
  }
  return template.keys;
}

export function runTemplate(args: string[]): void {
  const [subcommand, ...rest] = args;
  if (subcommand === 'create') {
    const [name, ...keys] = rest;
    if (!name || keys.length === 0) {
      console.error('Usage: envault template create <name> <key1> [key2 ...]');
      process.exit(1);
    }
    const template = createTemplate(name, keys);
    console.log(`Template "${template.name}" created with keys: ${template.keys.join(', ')}`);
  } else if (subcommand === 'delete') {
    const [name] = rest;
    if (!name) { console.error('Usage: envault template delete <name>'); process.exit(1); }
    deleteTemplate(name);
    console.log(`Template "${name}" deleted.`);
  } else if (subcommand === 'list') {
    const templates = loadTemplates();
    const names = Object.keys(templates);
    if (names.length === 0) { console.log('No templates found.'); return; }
    names.forEach((n) => {
      const t = templates[n];
      console.log(`  ${n}: [${t.keys.join(', ')}]${t.description ? ' — ' + t.description : ''}`);
    });
  } else if (subcommand === 'apply') {
    const [name] = rest;
    if (!name) { console.error('Usage: envault template apply <name>'); process.exit(1); }
    const keys = applyTemplate(name);
    console.log(`Applied template "${name}". Keys: ${keys.join(', ')}`);
  } else {
    console.error('Unknown template subcommand. Use: create | delete | list | apply');
    process.exit(1);
  }
}
