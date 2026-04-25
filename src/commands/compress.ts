import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const VAULT_FILE = ".envault/vault.json";
const COMPRESSED_FILE = ".envault/vault.json.gz";

export async function compressVault(): Promise<void> {
  if (!fs.existsSync(VAULT_FILE)) {
    throw new Error("No vault found. Run 'envault init' first.");
  }

  const raw = fs.readFileSync(VAULT_FILE);
  const compressed = await gzip(raw);
  fs.writeFileSync(COMPRESSED_FILE, compressed);
  const originalSize = raw.length;
  const compressedSize = compressed.length;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`Vault compressed: ${originalSize}B → ${compressedSize}B (${ratio}% reduction)`);
}

export async function decompressVault(): Promise<void> {
  if (!fs.existsSync(COMPRESSED_FILE)) {
    throw new Error("No compressed vault found at " + COMPRESSED_FILE);
  }

  const compressed = fs.readFileSync(COMPRESSED_FILE);
  const raw = await gunzip(compressed);
  fs.writeFileSync(VAULT_FILE, raw);
  console.log(`Vault decompressed to ${VAULT_FILE}`);
}

export function getVaultSizeInfo(): { raw: number; compressed: number | null } {
  const raw = fs.existsSync(VAULT_FILE) ? fs.statSync(VAULT_FILE).size : 0;
  const compressed = fs.existsSync(COMPRESSED_FILE)
    ? fs.statSync(COMPRESSED_FILE).size
    : null;
  return { raw, compressed };
}

export async function runCompress(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub === "decompress") {
    await decompressVault();
  } else if (sub === "info") {
    const info = getVaultSizeInfo();
    console.log(`Raw vault size:        ${info.raw} bytes`);
    if (info.compressed !== null) {
      const ratio = ((1 - info.compressed / info.raw) * 100).toFixed(1);
      console.log(`Compressed vault size: ${info.compressed} bytes (${ratio}% smaller)`);
    } else {
      console.log("Compressed vault:      not found");
    }
  } else {
    await compressVault();
  }
}
