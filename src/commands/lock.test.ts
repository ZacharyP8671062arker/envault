import * as fs from 'fs';
import * as path from 'path';
import { runLock, runUnlock } from './lock';
import {
  encryptPrivateKeyWithPassphrase,
  decryptPrivateKeyWithPassphrase,
} from '../crypto/deriveKey';

jest.mock('fs');
jest.mock('../crypto/deriveKey');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockEncrypt = encryptPrivateKeyWithPassphrase as jest.MockedFunction<typeof encryptPrivateKeyWithPassphrase>;
const mockDecrypt = decryptPrivateKeyWithPassphrase as jest.MockedFunction<typeof decryptPrivateKeyWithPassphrase>;

const PRIVATE_KEY_PATH = path.resolve('.envault', 'private.key');
const LOCKED_KEY_PATH = path.resolve('.envault', 'private.key.locked');
const FAKE_PEM = '-----BEGIN PRIVATE KEY-----\ndata\n-----END PRIVATE KEY-----';

function mockPrompt(answer: string) {
  jest.spyOn(require('readline'), 'createInterface').mockReturnValue({
    question: (_: string, cb: (a: string) => void) => cb(answer),
    close: jest.fn(),
  } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
});

describe('runLock', () => {
  it('exits if private key does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await expect(runLock()).rejects.toThrow('exit');
  });

  it('exits if key is already locked', async () => {
    mockedFs.existsSync.mockImplementation((p) => p === PRIVATE_KEY_PATH || p === LOCKED_KEY_PATH);
    await expect(runLock()).rejects.toThrow('exit');
  });

  it('encrypts and removes original key', async () => {
    mockedFs.existsSync.mockImplementation((p) => p === PRIVATE_KEY_PATH);
    mockedFs.readFileSync.mockReturnValue(FAKE_PEM as any);
    mockEncrypt.mockReturnValue('encrypted-base64');
    mockPrompt('my-passphrase');
    await runLock();
    expect(mockEncrypt).toHaveBeenCalledWith(FAKE_PEM, 'my-passphrase');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(LOCKED_KEY_PATH, 'encrypted-base64', 'utf8');
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(PRIVATE_KEY_PATH);
  });
});

describe('runUnlock', () => {
  it('exits if no locked key exists', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    await expect(runUnlock()).rejects.toThrow('exit');
  });

  it('decrypts and writes private key', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('encrypted-base64' as any);
    mockDecrypt.mockReturnValue(FAKE_PEM);
    mockPrompt('my-passphrase');
    await runUnlock();
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-base64', 'my-passphrase');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(PRIVATE_KEY_PATH, FAKE_PEM, 'utf8');
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(LOCKED_KEY_PATH);
  });

  it('exits on wrong passphrase', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('encrypted-base64' as any);
    mockDecrypt.mockImplementation(() => { throw new Error('bad decrypt'); });
    mockPrompt('wrong');
    await expect(runUnlock()).rejects.toThrow('exit');
  });
});
