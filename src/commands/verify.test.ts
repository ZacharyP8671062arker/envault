import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import { verifyVaultIntegrity } from "./verify";
import * as add from "./add";
import * as encrypt from "../crypto/encrypt";

vi.mock("fs");
vi.mock("./add");
vi.mock("../crypto/encrypt");

const mockFs = vi.mocked(fs);
const mockAdd = vi.mocked(add);
const mockEncrypt = vi.mocked(encrypt);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyVaultIntegrity", () => {
  it("returns empty array when vault is empty", async () => {
    mockAdd.loadVault.mockReturnValue({});
    mockFs.readFileSync = vi.fn().mockReturnValue("private-key-content");

    const results = await verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem");
    expect(results).toEqual([]);
  });

  it("returns ok for successfully decryptable entries", async () => {
    mockAdd.loadVault.mockReturnValue({ API_KEY: "encrypted-value" });
    mockFs.readFileSync = vi.fn().mockReturnValue("private-key-content");
    mockEncrypt.decryptWithPrivateKey.mockResolvedValue("decrypted-secret");

    const results = await verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ key: "API_KEY", status: "ok" });
  });

  it("returns corrupted for entries that fail decryption", async () => {
    mockAdd.loadVault.mockReturnValue({ DB_PASS: "bad-encrypted-value" });
    mockFs.readFileSync = vi.fn().mockReturnValue("private-key-content");
    mockEncrypt.decryptWithPrivateKey.mockRejectedValue(new Error("Decryption failed"));

    const results = await verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem");
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("corrupted");
    expect(results[0].error).toBe("Decryption failed");
  });

  it("returns missing for empty or invalid values", async () => {
    mockAdd.loadVault.mockReturnValue({ EMPTY_KEY: "" });
    mockFs.readFileSync = vi.fn().mockReturnValue("private-key-content");

    const results = await verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem");
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("missing");
  });

  it("throws if private key cannot be read", async () => {
    mockAdd.loadVault.mockReturnValue({ API_KEY: "some-value" });
    mockFs.readFileSync = vi.fn().mockImplementation(() => { throw new Error("File not found"); });

    await expect(
      verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem")
    ).rejects.toThrow("Cannot read private key");
  });

  it("handles multiple keys with mixed results", async () => {
    mockAdd.loadVault.mockReturnValue({
      GOOD_KEY: "valid-encrypted",
      BAD_KEY: "invalid-encrypted",
    });
    mockFs.readFileSync = vi.fn().mockReturnValue("private-key-content");
    mockEncrypt.decryptWithPrivateKey
      .mockResolvedValueOnce("decrypted")
      .mockRejectedValueOnce(new Error("bad cipher"));

    const results = await verifyVaultIntegrity(".envault/vault.json", ".envault/private.pem");
    expect(results).toHaveLength(2);
    expect(results.find(r => r.key === "GOOD_KEY")?.status).toBe("ok");
    expect(results.find(r => r.key === "BAD_KEY")?.status).toBe("corrupted");
  });
});
