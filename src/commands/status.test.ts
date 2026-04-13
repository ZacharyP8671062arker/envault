import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getVaultStatus, runStatus } from './status';

describe('getVaultStatus', () => {
  let tmpDir: string;
  let vaultDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-status-test-'));
    vaultDir = path.join(tmpDir, '.envault');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns all false when vault dir does not exist', () => {
    const status = getVaultStatus(vaultDir);
    expect(status.initialized).toBe(false);
    expect(status.hasPublicKey).toBe(false);
    expect(status.hasPrivateKey).toBe(false);
    expect(status.isLocked).toBe(false);
    expect(status.vaultExists).toBe(false);
    expect(status.secretCount).toBe(0);
    expect(status.sharedUsers).toEqual([]);
    expect(status.auditEntryCount).toBe(0);
  });

  it('detects initialized vault with keys', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, 'public.pem'), 'pubkey');
    fs.writeFileSync(path.join(vaultDir, 'private.pem'), 'privkey');

    const status = getVaultStatus(vaultDir);
    expect(status.initialized).toBe(true);
    expect(status.hasPublicKey).toBe(true);
    expect(status.hasPrivateKey).toBe(true);
    expect(status.isLocked).toBe(false);
  });

  it('detects locked private key', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, 'private.pem.locked'), 'locked');

    const status = getVaultStatus(vaultDir);
    expect(status.isLocked).toBe(true);
    expect(status.hasPrivateKey).toBe(false);
  });

  it('counts secrets in vault.json', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    const vault = { secrets: { KEY1: 'enc1', KEY2: 'enc2', KEY3: 'enc3' } };
    fs.writeFileSync(path.join(vaultDir, 'vault.json'), JSON.stringify(vault));

    const status = getVaultStatus(vaultDir);
    expect(status.secretCount).toBe(3);
  });

  it('lists shared users from shared directory', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    const sharedDir = path.join(vaultDir, 'shared');
    fs.mkdirSync(sharedDir);
    fs.writeFileSync(path.join(sharedDir, 'alice.pem'), 'key');
    fs.writeFileSync(path.join(sharedDir, 'bob.pem'), 'key');

    const status = getVaultStatus(vaultDir);
    expect(status.sharedUsers).toContain('alice');
    expect(status.sharedUsers).toContain('bob');
    expect(status.sharedUsers.length).toBe(2);
  });

  it('counts audit log entries', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, 'audit.log'), 'entry1\nentry2\nentry3\n');

    const status = getVaultStatus(vaultDir);
    expect(status.auditEntryCount).toBe(3);
  });

  it('runStatus prints output without throwing', () => {
    fs.mkdirSync(vaultDir, { recursive: true });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => runStatus(vaultDir)).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
