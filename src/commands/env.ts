import * as fs from "fs";
import * as path from "path";
import { loadVault } from "./add";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";

const DEFAULT_VAULT = ".envault/vault.json";
const DEFAULT_PRIVATE_KEY = ".envault/private.key";

export interface EnvEntry {
  key: string;
  value: string;
}

export async function decryptVaultEntries(
  vaultPath: string = DEFAULT_VAULT,
  privateKeyPath: string = DEFAULT_PRIVATE_KEY
): Promise<EnvEntry[]> {
  const vault = loadVault(vaultPath);
  const privateKey = loadPrivateKey(privateKeyPath);

  const entries: EnvEntry[] = [];
  for (const [key, encryptedValue] of Object.entries(vault)) {
    const value = decryptWithPrivateKey(encryptedValue as string, privateKey);
    entries.push({ key, value });
  }
  return entries;
}

export function formatEnvOutput(entries: EnvEntry[]): string {
  return entries.map(({ key, value }) => `${key}=${value}`).join("\n");
}

export async function runEnv(
  options: { output?: string; format?: "dotenv" | "json" | "export" } = {}
): Promise<void> {
  const entries = await decryptVaultEntries();

  let output: string;
  const fmt = options.format ?? "dotenv";

  if (fmt === "json") {
    const obj: Record<string, string> = {};
    entries.forEach(({ key, value }) => (obj[key] = value));
    output = JSON.stringify(obj, null, 2);
  } else if (fmt === "export") {
    output = entries.map(({ key, value }) => `export ${key}="${value}"`).join("\n");
  } else {
    output = formatEnvOutput(entries);
  }

  if (options.output) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, output, "utf-8");
    console.log(`Decrypted env written to ${options.output}`);
  } else {
    console.log(output);
  }
}
