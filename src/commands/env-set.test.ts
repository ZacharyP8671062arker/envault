import { parseKeyValue, runEnvSet } from './env-set';
import * as add from './add';
import * as keyPair from '../crypto/keyPair';
import * as encrypt from '../crypto/encrypt';
import * as policy from './policy';
import * as auditLogger from '../crypto/auditLogger';
import * as fs from 'fs';

jest.mock('./add');
jest.mock('../crypto/keyPair');
jest.mock('../crypto/encrypt');
jest.mock('./policy');
jest.mock('../crypto/auditLogger');
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockAdd = add as jest.Mocked<typeof add>;
const mockKeyPair = keyPair as jest.Mocked<typeof keyPair>;
const mockEncrypt = encrypt as jest.Mocked<typeof encrypt>;
const mockPolicy = policy as jest.Mocked<typeof policy>;
const mockAudit = auditLogger as jest.Mocked<typeof auditLogger>;

describe('parseKeyValue', () => {
  it('parses a simple KEY=VALUE', () => {
    expect(parseKeyValue('FOO=bar')).toEqual({ key: 'FOO', value: 'bar' });
  });

  it('strips double quotes from value', () => {
    expect(parseKeyValue('FOO="hello world"')).toEqual({ key: 'FOO', value: 'hello world' });
  });

  it('strips single quotes from value', () => {
    expect(parseKeyValue("FOO='hello'")).toEqual({ key: 'FOO', value: 'hello' });
  });

  it('handles values containing = signs', () => {
    expect(parseKeyValue('DB_URL=postgres://user:pass@host/db?ssl=true')).toEqual({
      key: 'DB_URL',
      value: 'postgres://user:pass@host/db?ssl=true',
    });
  });

  it('throws on missing = sign', () => {
    expect(() => parseKeyValue('NOEQUALS')).toThrow('Invalid KEY=VALUE format');
  });

  it('throws on invalid key name', () => {
    expect(() => parseKeyValue('123BAD=value')).toThrow('Invalid environment variable name');
  });
});

describe('runEnvSet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockKeyPair.loadPublicKey.mockReturnValue('MOCK_PUBLIC_KEY');
    mockAdd.loadVault.mockReturnValue({ EXISTING_KEY: 'enc_old' });
    mockEncrypt.encryptWithPublicKey.mockReturnValue('enc_new');
    mockPolicy.enforcePolicy.mockReturnValue(undefined);
    mockAudit.logAction.mockReturnValue(undefined);
    mockAdd.saveVault.mockReturnValue(undefined);
  });

  it('sets a new key in the vault', async () => {
    await runEnvSet(['NEW_KEY=secret']);
    expect(mockEncrypt.encryptWithPublicKey).toHaveBeenCalledWith('MOCK_PUBLIC_KEY', 'secret');
    expect(mockAdd.saveVault).toHaveBeenCalledWith(
      '.envault/vault.json',
      expect.objectContaining({ NEW_KEY: 'enc_new' })
    );
    expect(mockAudit.logAction).toHaveBeenCalledWith('set', 'NEW_KEY');
  });

  it('updates an existing key and logs update', async () => {
    await runEnvSet(['EXISTING_KEY=newval']);
    expect(mockAudit.logAction).toHaveBeenCalledWith('update', 'EXISTING_KEY');
  });

  it('throws if public key file is missing', async () => {
    mockFs.existsSync.mockReturnValue(false);
    await expect(runEnvSet(['FOO=bar'])).rejects.toThrow('Public key not found');
  });

  it('handles multiple entries in one call', async () => {
    await runEnvSet(['A=1', 'B=2', 'C=3']);
    expect(mockEncrypt.encryptWithPublicKey).toHaveBeenCalledTimes(3);
    expect(mockAdd.saveVault).toHaveBeenCalledTimes(1);
  });
});
