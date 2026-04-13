import * as fs from "fs";
import * as path from "path";
import { loadVault } from "./add";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";

export interface SearchResult {
  key: string;
  value: string;
  matchedOn: "key" | "value";
}

export async function searchVault(
  vaultPath: string,
  privateKeyPath: string,
  query: string,
  options: { searchValues?: boolean; caseSensitive?: boolean } = {}
): Promise<SearchResult[]> {
  const { searchValues = false, caseSensitive = false } = options;

  const vault = loadVault(vaultPath);
  const privateKey = loadPrivateKey(privateKeyPath);

  const results: SearchResult[] = [];
  const normalize = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const normalizedQuery = normalize(query);

  for (const [encKey, encValue] of Object.entries(vault)) {
    let decryptedKey: string;
    let decryptedValue: string;

    try {
      decryptedKey = decryptWithPrivateKey(encKey, privateKey);
      decryptedValue = decryptWithPrivateKey(encValue as string, privateKey);
    } catch {
      continue;
    }

    if (normalize(decryptedKey).includes(normalizedQuery)) {
      results.push({ key: decryptedKey, value: decryptedValue, matchedOn: "key" });
      continue;
    }

    if (searchValues && normalize(decryptedValue).includes(normalizedQuery)) {
      results.push({ key: decryptedKey, value: decryptedValue, matchedOn: "value" });
    }
  }

  return results;
}

export async function runSearch(
  query: string,
  options: { vaultPath?: string; keyPath?: string; searchValues?: boolean; caseSensitive?: boolean } = {}
): Promise<void> {
  const vaultPath = options.vaultPath ?? path.join(process.cwd(), ".envault", "vault.json");
  const keyPath = options.keyPath ?? path.join(process.cwd(), ".envault", "private.pem");

  if (!fs.existsSync(vaultPath)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const results = await searchVault(vaultPath, keyPath, query, {
    searchValues: options.searchValues,
    caseSensitive: options.caseSensitive,
  });

  if (results.length === 0) {
    console.log(`No matches found for "${query}".`);
    return;
  }

  console.log(`Found ${results.length} match(es) for "${query}":\n`);
  for (const result of results) {
    const matchLabel = result.matchedOn === "key" ? "[key]" : "[value]";
    console.log(`  ${matchLabel} ${result.key}=${result.value}`);
  }
}
