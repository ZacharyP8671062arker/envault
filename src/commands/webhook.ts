import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const WEBHOOK_CONFIG_FILE = '.envault/webhooks.json';

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export interface WebhookStore {
  [name: string]: WebhookConfig;
}

export function loadWebhooks(): WebhookStore {
  if (!fs.existsSync(WEBHOOK_CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_FILE, 'utf-8'));
}

export function saveWebhooks(store: WebhookStore): void {
  const dir = path.dirname(WEBHOOK_CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WEBHOOK_CONFIG_FILE, JSON.stringify(store, null, 2));
}

export function registerWebhook(name: string, url: string, events: string[], secret?: string): void {
  const store = loadWebhooks();
  store[name] = { url, events, secret };
  saveWebhooks(store);
}

export function removeWebhook(name: string): boolean {
  const store = loadWebhooks();
  if (!store[name]) return false;
  delete store[name];
  saveWebhooks(store);
  return true;
}

export function dispatchWebhook(config: WebhookConfig, event: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const parsed = new URL(config.url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(config.secret ? { 'X-Envault-Secret': config.secret } : {}),
      },
    };
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function notifyWebhooks(event: string, payload: object): Promise<void> {
  const store = loadWebhooks();
  const promises = Object.values(store)
    .filter((cfg) => cfg.events.includes(event) || cfg.events.includes('*'))
    .map((cfg) => dispatchWebhook(cfg, event, payload).catch(() => {}));
  await Promise.all(promises);
}

export function runWebhook(args: string[]): void {
  const [sub, name, ...rest] = args;
  if (sub === 'add' && name && rest[0]) {
    const events = rest[1] ? rest[1].split(',') : ['*'];
    const secret = rest[2];
    registerWebhook(name, rest[0], events, secret);
    console.log(`Webhook '${name}' registered for events: ${events.join(', ')}`);
  } else if (sub === 'remove' && name) {
    const removed = removeWebhook(name);
    console.log(removed ? `Webhook '${name}' removed.` : `Webhook '${name}' not found.`);
  } else if (sub === 'list') {
    const store = loadWebhooks();
    const entries = Object.entries(store);
    if (entries.length === 0) { console.log('No webhooks registered.'); return; }
    entries.forEach(([n, cfg]) => console.log(`${n}: ${cfg.url} [${cfg.events.join(', ')}]`));
  } else {
    console.log('Usage: envault webhook <add|remove|list> [name] [url] [events] [secret]');
  }
}
