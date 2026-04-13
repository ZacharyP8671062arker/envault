import * as fs from 'fs';
import * as path from 'path';
import { runDiff } from './diff';
import { loadVault } from './add';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

jest.mock('fs');
jest.mock('./add');
jest.mock('../crypto/encrypt');
jest.mock('../crypto/keyPair');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedLoadVault = loadVault as jest.Mock;
const mockedDecrypt = decryptWithPrivateKey as jest.Mock;
const mockedLoadPrivateKey = loadPrivateKey as jest.Mock;

describe('runDiff integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadPrivateKey.mockReturnValue('mock-private-key');
  });

  it('prints sync message when no differences exist', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('FOO=bar\nBAZ=qux');
    mockedLoadVault.mockReturnValue({ FOO: 'enc_bar', BAZ: 'enc_qux' });
    mockedDecrypt
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce('qux');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runDiff('.env');
    expect(consoleSpy).toHaveBeenCalledWith(
      'No differences found. Local and vault are in sync.'
    );
    consoleSpy.mockRestore();
  });

  it('exits with error when env file does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(runDiff('.env')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Error: .env not found.');
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('reports added keys correctly', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('FOO=bar\nNEW_KEY=secret');
    mockedLoadVault.mockReturnValue({ FOO: 'enc_bar' });
    mockedDecrypt.mockReturnValueOnce('bar');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runDiff('.env');

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('+ NEW_KEY');
    consoleSpy.mockRestore();
  });

  it('handles decryption failures gracefully', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('FOO=bar');
    mockedLoadVault.mockReturnValue({ FOO: 'bad_encrypted', GHOST: 'also_bad' });
    mockedDecrypt.mockImplementation(() => { throw new Error('decrypt failed'); });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runDiff('.env');

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('GHOST');
    consoleSpy.mockRestore();
  });
});
