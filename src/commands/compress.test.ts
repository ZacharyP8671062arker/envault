import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { compressVault, decompressVault, getVaultSizeInfo } from "./compress";

const VAULT_FILE = ".envault/vault.json";
const COMPRESSED_FILE = ".envault/vault.json.gz";

let originalCwd: string;
let tmpDir: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-compress-"));
  process.chdir(tmpDir);
  fs.mkdirSync(".envault", { recursive: true });
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("compressVault", () => {
  it("throws if vault does not exist", async () => {
    await expect(compressVault()).rejects.toThrow("No vault found");
  });

  it("creates a compressed file from vault.json", async () => {
    const data = JSON.stringify({ keys: { FOO: "bar", BAZ: "qux" } });
    fs.writeFileSync(VAULT_FILE, data);
    await compressVault();
    expect(fs.existsSync(COMPRESSED_FILE)).toBe(true);
  });

  it("compressed file is smaller than or equal to original for typical JSON", async () => {
    const data = JSON.stringify({
      keys: Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`KEY_${i}`, `value_${i}_${'x'.repeat(40)}`])
      )
    });
    fs.writeFileSync(VAULT_FILE, data);
    await compressVault();
    const rawSize = fs.statSync(VAULT_FILE).size;
    const compressedSize = fs.statSync(COMPRESSED_FILE).size;
    expect(compressedSize).toBeLessThan(rawSize);
  });
});

describe("decompressVault", () => {
  it("throws if compressed vault does not exist", async () => {
    await expect(decompressVault()).rejects.toThrow("No compressed vault found");
  });

  it("restores vault.json from compressed file", async () => {
    const data = JSON.stringify({ keys: { HELLO: "world" } });
    fs.writeFileSync(VAULT_FILE, data);
    await compressVault();
    fs.rmSync(VAULT_FILE);
    await decompressVault();
    expect(fs.existsSync(VAULT_FILE)).toBe(true);
    const restored = fs.readFileSync(VAULT_FILE, "utf-8");
    expect(JSON.parse(restored)).toEqual({ keys: { HELLO: "world" } });
  });
});

describe("getVaultSizeInfo", () => {
  it("returns zero raw size and null compressed when no files exist", () => {
    const info = getVaultSizeInfo();
    expect(info.raw).toBe(0);
    expect(info.compressed).toBeNull();
  });

  it("returns both sizes when both files exist", async () => {
    const data = JSON.stringify({ keys: { A: "1" } });
    fs.writeFileSync(VAULT_FILE, data);
    await compressVault();
    const info = getVaultSizeInfo();
    expect(info.raw).toBeGreaterThan(0);
    expect(info.compressed).not.toBeNull();
  });
});
