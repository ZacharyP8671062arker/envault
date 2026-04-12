import fs from "fs";
import path from "path";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";

const VAULT_FILE = ".envault/vault.json";

export interface VaultEntry {
  key: string;
  encryptedValue: string;
}

export interface Vault {
  entries: VaultEntry[];
}

export async function runPull(outputFile: string = ".env"): Promise<void> {
  if (!fs.existsSync(VAULT_FILE)) {
    console.error("No vault file found. Run `envault push` first.");
    process.exit(1);
  }

  const privateKey = await loadPrivateKey();
  if (!privateKey) {
    console.error("Private key not found. Run `envault init` first.");
    process.exit(1);
  }

  const raw = fs.readFileSync(VAULT_FILE, "utf-8");
  const vault: Vault = JSON.parse(raw);

  const lines: string[] = [];

  for (const entry of vault.entries) {
    try {
      const decrypted = decryptWithPrivateKey(entry.encryptedValue, privateKey);
      lines.push(`${entry.key}=${decrypted}`);
    } catch {
      console.warn(`Warning: Could not decrypt value for key "${entry.key}". Skipping.`);
    }
  }

  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf-8");
  console.log(`Decrypted ${lines.length} variable(s) to ${outputFile}`);
}
