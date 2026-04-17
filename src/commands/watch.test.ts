import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncEnvToVault } from './watch';

vi.mock('./add', () => ({
  loadVault: vi.fn(() => ({})),
  saveVault: vi.fn(),
}));

vi.mock('./push', () => ({
  parseEnvFile: vi.fn(() => ({ API_KEY: 'secret', DB_PASS: 'pass123' })),
}));

vi.mock('../crypto/encrypt', () => ({
  encryptWithPublicKey: vi.fn(async (val: string) => `enc:${val}`),
}));

vi.mock('../crypto/keyPair', () => ({
  loadPublicKey: vi.fn(async () => 'mock-public-key'),
}));

vi.mock('../crypto/auditLogger', () => ({
  logAction: vi.fn(async () => {}),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return { ...actual, readFileSync: vi.fn(() => 'API_KEY=secret\nDB_PASS=pass123') };
});

import { loadVault, saveVault } from './add';
import { logAction } from '../crypto/auditLogger';

describe('syncEnvToVault', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads vault and saves encrypted entries', async () => {
    await syncEnvToVault('.env');
    expect(loadVault).toHaveBeenCalled();
    expect(saveVault).toHaveBeenCalledWith(
      '.envault/vault.json',
      expect.objectContaining({
        API_KEY: 'enc:secret',
        DB_PASS: 'enc:pass123',
      })
    );
  });

  it('logs the sync action', async () => {
    await syncEnvToVault('.env');
    expect(logAction).toHaveBeenCalledWith('watch-sync', expect.stringContaining('2 keys'));
  });

  it('encrypts each value with the public key', async () => {
    const { encryptWithPublicKey } = await import('../crypto/encrypt');
    await syncEnvToVault('.env');
    expect(encryptWithPublicKey).toHaveBeenCalledTimes(2);
    expect(encryptWithPublicKey).toHaveBeenCalledWith('secret', 'mock-public-key');
    expect(encryptWithPublicKey).toHaveBeenCalledWith('pass123', 'mock-public-key');
  });
});
