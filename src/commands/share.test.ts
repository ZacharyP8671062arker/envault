import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { shareVaultWithUser, runShare } from './share';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { saveVault } from './add';

describe('share command', () => {
  let tmpDir: string;
  let ownerKeys: { publicKey: string; privateKey: string };
  let recipientKeys: { publicKey: string; privateKey: string };
  let vaultPath: string;
  let ownerPrivatePath: string;
  let recipientPublicPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-share-test-'));
    ownerKeys = generateKeyPair();
    recipientKeys = generateKeyPair();

    ownerPrivatePath = path.join(tmpDir, 'owner_private.pem');
    const ownerPublicPath = path.join(tmpDir, 'owner_public.pem');
    recipientPublicPath = path.join(tmpDir, 'recipient_public.pem');

    fs.writeFileSync(ownerPrivatePath, ownerKeys.privateKey);
    fs.writeFileSync(ownerPublicPath, ownerKeys.publicKey);
    fs.writeFileSync(recipientPublicPath, recipientKeys.publicKey);

    vaultPath = path.join(tmpDir, 'vault.json');
    const encrypted = encryptWithPublicKey('super_secret_value', ownerKeys.publicKey);
    saveVault(vaultPath, { secrets: { API_KEY: encrypted } });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shares vault secrets with a recipient user', async () => {
    await shareVaultWithUser(vaultPath, 'alice', recipientPublicPath, ownerPrivatePath);
    const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(vault.shared).toBeDefined();
    expect(vault.shared['alice']).toBeDefined();
    expect(vault.shared['alice'].encryptedSecrets['API_KEY']).toBeDefined();
  });

  it('re-encrypts secrets with recipient public key', async () => {
    const { decryptWithPrivateKey } = await import('../crypto/encrypt');
    await shareVaultWithUser(vaultPath, 'alice', recipientPublicPath, ownerPrivatePath);
    const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    const decrypted = decryptWithPrivateKey(
      vault.shared['alice'].encryptedSecrets['API_KEY'],
      recipientKeys.privateKey
    );
    expect(decrypted).toBe('super_secret_value');
  });

  it('throws if vault does not exist', async () => {
    await expect(
      runShare('bob', recipientPublicPath, { vault: '/nonexistent/vault.json', key: ownerPrivatePath })
    ).rejects.toThrow('Vault not found');
  });

  it('throws if recipient public key does not exist', async () => {
    await expect(
      runShare('bob', '/nonexistent/key.pem', { vault: vaultPath, key: ownerPrivatePath })
    ).rejects.toThrow('Recipient public key not found');
  });
});
