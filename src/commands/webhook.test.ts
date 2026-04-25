import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadWebhooks,
  saveWebhooks,
  registerWebhook,
  removeWebhook,
  notifyWebhooks,
  dispatchWebhook,
} from './webhook';

const CONFIG = '.envault/webhooks.json';

beforeEach(() => {
  if (fs.existsSync(CONFIG)) fs.rmSync(CONFIG);
});

afterEach(() => {
  if (fs.existsSync(CONFIG)) fs.rmSync(CONFIG);
  vi.restoreAllMocks();
});

describe('loadWebhooks', () => {
  it('returns empty object when file missing', () => {
    expect(loadWebhooks()).toEqual({});
  });

  it('returns parsed content', () => {
    fs.mkdirSync('.envault', { recursive: true });
    fs.writeFileSync(CONFIG, JSON.stringify({ hook1: { url: 'http://a.com', events: ['push'] } }));
    expect(loadWebhooks()).toHaveProperty('hook1');
  });
});

describe('registerWebhook', () => {
  it('stores webhook entry', () => {
    registerWebhook('ci', 'https://ci.example.com/hook', ['push', 'pull']);
    const store = loadWebhooks();
    expect(store['ci']).toMatchObject({ url: 'https://ci.example.com/hook', events: ['push', 'pull'] });
  });

  it('stores webhook with secret', () => {
    registerWebhook('secure', 'https://example.com', ['*'], 'mysecret');
    expect(loadWebhooks()['secure'].secret).toBe('mysecret');
  });
});

describe('removeWebhook', () => {
  it('removes existing webhook', () => {
    registerWebhook('old', 'http://example.com', ['push']);
    expect(removeWebhook('old')).toBe(true);
    expect(loadWebhooks()['old']).toBeUndefined();
  });

  it('returns false for missing webhook', () => {
    expect(removeWebhook('nonexistent')).toBe(false);
  });
});

describe('notifyWebhooks', () => {
  it('dispatches to matching event hooks', async () => {
    registerWebhook('h1', 'http://example.com/hook', ['push']);
    registerWebhook('h2', 'http://example.com/other', ['pull']);
    const spy = vi.spyOn(await import('./webhook'), 'dispatchWebhook').mockResolvedValue(undefined);
    await notifyWebhooks('push', { key: 'API_KEY' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('dispatches to wildcard hooks', async () => {
    registerWebhook('all', 'http://example.com/all', ['*']);
    const spy = vi.spyOn(await import('./webhook'), 'dispatchWebhook').mockResolvedValue(undefined);
    await notifyWebhooks('rotate', { key: 'SECRET' });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not throw if dispatch fails', async () => {
    registerWebhook('bad', 'http://broken.invalid', ['push']);
    await expect(notifyWebhooks('push', {})).resolves.not.toThrow();
  });
});
