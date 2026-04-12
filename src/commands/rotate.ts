import fs from "fs";
import path from "path";
import { generateKeyPair, saveKeyPair, loadPublicKey } from "../crypto/keyPair";
import { encryptWithPublicKey, decryptWithPrivateKey } from "../crypto/encrypt";
import { loadVault, saveVault } from "./add";

const VAULT_PATH = path.resolve(".envault", "vault.json");
const KEY_DIR = path.resolve(".envault");

export async function runRotate(): Promise<void> {
  if (!fs.existsSync(VAULT_PATH)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  // Load old private key before overwriting
  const oldPrivateKeyPath = path.join(KEY_DIR, "private.pem");
  if (!fs.existsSync(oldPrivateKeyPath)) {
    console.error("Private key not found. Cannot rotate without existing private key.");
    process.exit(1);
  }

  const oldPrivateKey = fs.readFileSync(oldPrivateKeyPath, "utf-8");

  // Decrypt existing vault entries with old private key
  const vault = loadVault();
  const decrypted: Record<string, string> = {};

  for (const [key, encryptedValue] of Object.entries(vault)) {
    try {
      decrypted[key] = decryptWithPrivateKey(encryptedValue, oldPrivateKey);
    } catch {
      console.error(`Failed to decrypt key "${key}" with old private key.`);
      process.exit(1);
    }
  }

  // Generate new key pair
  const { publicKey, privateKey } = generateKeyPair();
  saveKeyPair(publicKey, privateKey);

  // Re-encrypt all values with new public key
  const reEncrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(decrypted)) {
    reEncrypted[key] = encryptWithPublicKey(value, publicKey);
  }

  saveVault(reEncrypted);

  console.log("Key rotation complete. All vault entries re-encrypted with new key pair.");
}
