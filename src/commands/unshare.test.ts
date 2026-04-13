import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { unshareVaultFromUser, listSharedUsers, runUnshare } from './unshare';
import { saveVault } from './add';

describe('unshare command', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-unshare-test-'));
    vaultPath = path.join(tmpDir, 'vault.json');

    saveVault(vaultPath, {
      secrets: { API_KEY: 'encrypted_value' },
      shared: {
        alice: { publicKeyPath: '/keys/alice.pem', encryptedSecrets: { API_KEY: 'enc_for_alice' } },
        bob: { publicKeyPath: '/keys/bob.pem', encryptedSecrets: { API_KEY: 'enc_for_bob' } },
      },
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes a shared user from the vault', () => {
    unshareVaultFromUser(vaultPath, 'alice');
    const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(vault.shared['alice']).toBeUndefined();
    expect(vault.shared['bob']).toBeDefined();
  });

  it('throws if user does not have shared access', () => {
    expect(() => unshareVaultFromUser(vaultPath, 'charlie')).toThrow(
      "User 'charlie' does not have shared access"
    );
  });

  it('lists all shared users', () => {
    const users = listSharedUsers(vaultPath);
    expect(users).toContain('alice');
    expect(users).toContain('bob');
    expect(users).toHaveLength(2);
  });

  it('returns empty array when no shared users', () => {
    saveVault(vaultPath, { secrets: {} });
    const users = listSharedUsers(vaultPath);
    expect(users).toHaveLength(0);
  });

  it('throws via runUnshare if vault does not exist', async () => {
    await expect(
      runUnshare('alice', { vault: '/nonexistent/vault.json' })
    ).rejects.toThrow('Vault not found');
  });
});
