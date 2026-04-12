import * as fs from 'fs';
import * as path from 'path';
import { runAdd } from './add';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';

const ENVAULT_DIR = '.envault';
const VAULT_FILE = path.join(ENVAULT_DIR, 'vault.json');

describe('runAdd', () => {
  beforeEach(() => {
    if (fs.existsSync(ENVAULT_DIR)) {
      fs.rmSync(ENVAULT_DIR, { recursive: true });
    }
    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey);

    jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (fs.existsSync(ENVAULT_DIR)) {
      fs.rmSync(ENVAULT_DIR, { recursive: true });
    }
  });

  it('should create vault.json with an encrypted entry', async () => {
    const rl = require('readline');
    jest.spyOn(rl, 'createInterface').mockReturnValue({
      question: (_prompt: string, cb: (ans: string) => void) => cb('mysecretvalue'),
      close: jest.fn(),
    });

    await runAdd('MY_SECRET');

    expect(fs.existsSync(VAULT_FILE)).toBe(true);
    const vault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
    expect(vault.entries).toHaveLength(1);
    expect(vault.entries[0].key).toBe('MY_SECRET');
    expect(vault.entries[0].encryptedValue).toBeTruthy();
  });

  it('should decrypt the stored value correctly', async () => {
    const { privateKey } = require('../crypto/keyPair').loadPrivateKey
      ? { privateKey: require('../crypto/keyPair').loadPrivateKey() }
      : { privateKey: null };

    const rl = require('readline');
    jest.spyOn(rl, 'createInterface').mockReturnValue({
      question: (_prompt: string, cb: (ans: string) => void) => cb('hello_world'),
      close: jest.fn(),
    });

    await runAdd('API_KEY');

    const vault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
    const entry = vault.entries.find((e: { key: string }) => e.key === 'API_KEY');
    const pk = require('../crypto/keyPair').loadPrivateKey();
    const decrypted = decryptWithPrivateKey(pk, entry.encryptedValue);
    expect(decrypted).toBe('hello_world');
  });

  it('should update an existing entry', async () => {
    const rl = require('readline');
    let callCount = 0;
    jest.spyOn(rl, 'createInterface').mockImplementation(() => ({
      question: (_prompt: string, cb: (ans: string) => void) => cb(callCount++ === 0 ? 'first' : 'second'),
      close: jest.fn(),
    }));

    await runAdd('TOKEN');
    await runAdd('TOKEN');

    const vault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
    expect(vault.entries.filter((e: { key: string }) => e.key === 'TOKEN')).toHaveLength(1);
  });
});
