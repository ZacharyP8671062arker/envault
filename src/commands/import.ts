import * as fs from "fs";
import * as path from "path";
import { loadVault, saveVault } from "./add";
import { encryptWithPublicKey } from "../crypto/encrypt";
import { loadPublicKey } from "../crypto/keyPair";
import { logAction } from "../crypto/auditLogger";

export function parseEnvLines(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export async function runImport(
  envFilePath: string,
  vaultPath: string = ".envault/vault.json",
  keysDir: string = ".envault"
): Promise<{ imported: string[]; skipped: string[] }> {
  const absPath = path.resolve(envFilePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const entries = parseEnvLines(content);

  const publicKey = loadPublicKey(keysDir);
  const vault = loadVault(vaultPath);

  const imported: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (vault[key] !== undefined) {
      skipped.push(key);
      continue;
    }
    vault[key] = encryptWithPublicKey(value, publicKey);
    imported.push(key);
  }

  if (imported.length > 0) {
    saveVault(vault, vaultPath);
    logAction("import", `Imported ${imported.length} key(s) from ${envFilePath}: ${imported.join(", ")}`);
  }

  return { imported, skipped };
}
