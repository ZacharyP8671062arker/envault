import { renameVaultKey } from './rename';
import { loadVault, saveVault } from './add';
import { logAction } from '../crypto/auditLogger';

jest.mock('./add');
jest.mock('../crypto/auditLogger');

const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockSaveVault = saveVault as jest.MockedFunction<typeof saveVault>;
const mockLogAction = logAction as jest.MockedFunction<typeof logAction>;

describe('renameVaultKey', () => {
  const fakeVaultPath = '/fake/.envault/vault.json';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveVault.mockResolvedValue(undefined);
    mockLogAction.mockResolvedValue(undefined);
  });

  it('renames an existing key to a new name', async () => {
    mockLoadVault.mockResolvedValue({ OLD_KEY: 'encrypted_value', OTHER: 'val' });

    await renameVaultKey('OLD_KEY', 'NEW_KEY', fakeVaultPath);

    expect(mockSaveVault).toHaveBeenCalledWith(
      { NEW_KEY: 'encrypted_value', OTHER: 'val' },
      fakeVaultPath
    );
    expect(mockLogAction).toHaveBeenCalledWith('rename', 'Renamed key "OLD_KEY" to "NEW_KEY"');
  });

  it('throws if old key does not exist', async () => {
    mockLoadVault.mockResolvedValue({ SOME_KEY: 'val' });

    await expect(renameVaultKey('MISSING_KEY', 'NEW_KEY', fakeVaultPath))
      .rejects.toThrow('Key "MISSING_KEY" not found in vault.');
  });

  it('throws if new key already exists', async () => {
    mockLoadVault.mockResolvedValue({ OLD_KEY: 'val', EXISTING_KEY: 'other' });

    await expect(renameVaultKey('OLD_KEY', 'EXISTING_KEY', fakeVaultPath))
      .rejects.toThrow('Key "EXISTING_KEY" already exists in vault.');
  });

  it('throws if old and new key names are the same', async () => {
    mockLoadVault.mockResolvedValue({ MY_KEY: 'val' });

    await expect(renameVaultKey('MY_KEY', 'MY_KEY', fakeVaultPath))
      .rejects.toThrow('Old and new key names must be different.');
  });

  it('throws if new key name contains invalid characters', async () => {
    mockLoadVault.mockResolvedValue({ MY_KEY: 'val' });

    await expect(renameVaultKey('MY_KEY', 'invalid-key', fakeVaultPath))
      .rejects.toThrow('Key names must only contain uppercase letters, digits, and underscores.');
  });

  it('throws if either key name is empty', async () => {
    await expect(renameVaultKey('', 'NEW_KEY', fakeVaultPath))
      .rejects.toThrow('Both old and new key names are required.');
  });
});
