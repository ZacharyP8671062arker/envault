import * as fs from "fs";
import * as path from "path";
import { loadVault } from "./add";

export interface EnvCheckResult {
  missing: string[];
  extra: string[];
  matched: string[];
}

export function parseEnvKeys(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0].trim());
}

export function checkEnvAgainstVault(
  envFilePath: string,
  vaultPath: string
): EnvCheckResult {
  const envKeys = new Set(parseEnvKeys(envFilePath));
  const vault = loadVault(vaultPath);
  const vaultKeys = new Set(Object.keys(vault));

  const missing: string[] = [];
  const extra: string[] = [];
  const matched: string[] = [];

  for (const key of vaultKeys) {
    if (envKeys.has(key)) {
      matched.push(key);
    } else {
      missing.push(key);
    }
  }

  for (const key of envKeys) {
    if (!vaultKeys.has(key)) {
      extra.push(key);
    }
  }

  return { missing, extra, matched };
}

export function runEnvCheck(
  envFilePath: string = ".env",
  vaultPath: string = ".envault/vault.json"
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const result = checkEnvAgainstVault(envFilePath, vaultPath);

  console.log(`\nEnv Check: ${envFilePath} vs vault\n`);

  if (result.matched.length > 0) {
    console.log(`✅ Matched (${result.matched.length}):`);
    result.matched.forEach((k) => console.log(`   ${k}`));
  }

  if (result.missing.length > 0) {
    console.log(`\n⚠️  Missing from .env (${result.missing.length}):`);
    result.missing.forEach((k) => console.log(`   ${k}`));
  }

  if (result.extra.length > 0) {
    console.log(`\n🔍 Extra in .env not in vault (${result.extra.length}):`);
    result.extra.forEach((k) => console.log(`   ${k}`));
  }

  if (result.missing.length === 0 && result.extra.length === 0) {
    console.log("\n✅ Your .env is in sync with the vault.");
  }
}
