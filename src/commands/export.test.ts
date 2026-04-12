import * as fs from 'fs';
import * as path from 'path';
import { runExport } from './export';
import { loadVault } from './add';
import { loadPrivateKey } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';

jest.mock('fs');
jest.mock('./add');
jest.mock('../crypto/keyPair');
jest.mock('../crypto/encrypt');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockLoadPrivateKey = loadPrivateKey as jest.MockedFunction<typeof loadPrivateKey>;
const mockDecrypt = decryptWithPrivateKey as jest.MockedFunction<typeof decryptWithPrivateKey>;

describe('runExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockLoadPrivateKey.mockResolvedValue('mock-private-key');
    mockDecrypt.mockImplementation((val) => `decrypted-${val}`);
    mockLoadVault.mockReturnValue({
      default: { API_KEY: 'enc-api', SECRET: 'enc-secret' },
    } as any);
  });

  it('throws if vault does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(false);
    await expect(runExport()).rejects.toThrow('No vault found');
  });

  it('throws if environment not found in vault', async () => {
    await expect(runExport({ environment: 'staging' })).rejects.toThrow(
      'Environment "staging" not found'
    );
  });

  it('throws if output file exists and overwrite is false', async () => {
    mockFs.existsSync.mockReturnValue(true);
    await expect(runExport({ overwrite: false })).rejects.toThrow('already exists');
  });

  it('writes decrypted env vars to output file', async () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await runExport({ output: '.env.out' });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve('.env.out'),
      expect.stringContaining('API_KEY=decrypted-enc-api'),
      'utf-8'
    );
  });

  it('overwrites existing file when overwrite is true', async () => {
    mockFs.existsSync.mockReturnValue(true);
    await runExport({ overwrite: true });
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('uses default output path for default environment', async () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await runExport();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve('.env'),
      expect.any(String),
      'utf-8'
    );
  });
});
