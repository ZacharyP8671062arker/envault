import * as fs from 'fs';
import * as path from 'path';
import { runRevoke } from './revoke';
import { loadVault, saveVault } from './add';

jest.mock('fs');
jest.mock('./add');

const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockSaveVault = saveVault as jest.MockedFunction<typeof saveVault>;
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('runRevoke', () => {
  const vaultPath = path.join('.envault', 'vault.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if vault does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(runRevoke('alice@example.com')).rejects.toThrow('No vault found');
  });

  it('throws if member not found in vault', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockResolvedValue({ members: [{ email: 'bob@example.com' }], secrets: {} });
    await expect(runRevoke('alice@example.com')).rejects.toThrow('Member "alice@example.com" not found');
  });

  it('removes member and their secrets from vault', async () => {
    mockExistsSync.mockReturnValue(true);
    const vault = {
      members: [{ email: 'alice@example.com' }, { email: 'bob@example.com' }],
      secrets: {
        API_KEY: { 'alice@example.com': 'enc_alice', 'bob@example.com': 'enc_bob' },
      },
    };
    mockLoadVault.mockResolvedValue(vault);
    mockSaveVault.mockResolvedValue(undefined);

    await runRevoke('alice@example.com');

    expect(vault.members).toHaveLength(1);
    expect(vault.members[0].email).toBe('bob@example.com');
    expect(vault.secrets.API_KEY['alice@example.com']).toBeUndefined();
    expect(vault.secrets.API_KEY['bob@example.com']).toBe('enc_bob');
    expect(mockSaveVault).toHaveBeenCalledWith(vaultPath, vault);
  });

  it('throws if vault has no members list', async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoadVault.mockResolvedValue({ secrets: {} });
    await expect(runRevoke('alice@example.com')).rejects.toThrow('Vault has no members list');
  });
});
