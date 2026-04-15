import * as fs from "fs";
import * as path from "path";
import { loadPublicKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";
import { loadVault } from "./add";

export interface VerifyResult {
  key: string;
  status: "ok" | "corrupted" | "missing";
  error?: string;
}

export async function verifyVaultIntegrity(
  vaultPath: string,
  privateKeyPath: string
): Promise<VerifyResult[]> {
  const vault = loadVault(vaultPath);
  const results: VerifyResult[] = [];

  if (Object.keys(vault).length === 0) {
    return results;
  }

  let privateKey: string;
  try {
    privateKey = fs.readFileSync(privateKeyPath, "utf-8");
  } catch {
    throw new Error(`Cannot read private key from ${privateKeyPath}`);
  }

  for (const [key, encryptedValue] of Object.entries(vault)) {
    if (typeof encryptedValue !== "string" || encryptedValue.trim() === "") {
      results.push({ key, status: "missing", error: "Empty or invalid value" });
      continue;
    }
    try {
      await decryptWithPrivateKey(encryptedValue, privateKey);
      results.push({ key, status: "ok" });
    } catch (err: any) {
      results.push({ key, status: "corrupted", error: err.message });
    }
  }

  return results;
}

export async function runVerify(
  vaultPath = ".envault/vault.json",
  privateKeyPath = ".envault/private.pem"
): Promise<void> {
  console.log("Verifying vault integrity...\n");

  let results: VerifyResult[];
  try {
    results = await verifyVaultIntegrity(vaultPath, privateKeyPath);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log("Vault is empty. Nothing to verify.");
    return;
  }

  let allOk = true;
  for (const result of results) {
    if (result.status === "ok") {
      console.log(`  ✓ ${result.key}`);
    } else {
      allOk = false;
      console.log(`  ✗ ${result.key} [${result.status}]${result.error ? ": " + result.error : ""}`);
    }
  }

  console.log();
  if (allOk) {
    console.log("All vault entries verified successfully.");
  } else {
    console.log("Some entries failed verification. Your vault may be corrupted.");
    process.exit(1);
  }
}
