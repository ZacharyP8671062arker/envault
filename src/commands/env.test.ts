import { describe, it, expect, vi, beforeEach } from "vitest";
import { decryptVaultEntries, formatEnvOutput, runEnv } from "./env";
import * as add from "./add";
import * as keyPair from "../crypto/keyPair";
import * as encrypt from "../crypto/encrypt";

vi.mock("./add");
vi.mock("../crypto/keyPair");
vi.mock("../crypto/encrypt");

const mockVault = {
  API_KEY: "enc_api_key",
  DB_URL: "enc_db_url",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(add.loadVault).mockReturnValue(mockVault as any);
  vi.mocked(keyPair.loadPrivateKey).mockReturnValue("mock_private_key" as any);
  vi.mocked(encrypt.decryptWithPrivateKey)
    .mockReturnValueOnce("secret123")
    .mockReturnValueOnce("postgres://localhost/db");
});

describe("decryptVaultEntries", () => {
  it("decrypts all entries from vault", async () => {
    const entries = await decryptVaultEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: "API_KEY", value: "secret123" });
    expect(entries[1]).toEqual({ key: "DB_URL", value: "postgres://localhost/db" });
  });

  it("calls decryptWithPrivateKey for each entry", async () => {
    await decryptVaultEntries();
    expect(encrypt.decryptWithPrivateKey).toHaveBeenCalledTimes(2);
    expect(encrypt.decryptWithPrivateKey).toHaveBeenCalledWith("enc_api_key", "mock_private_key");
  });
});

describe("formatEnvOutput", () => {
  it("formats entries as dotenv lines", () => {
    const entries = [
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ];
    expect(formatEnvOutput(entries)).toBe("FOO=bar\nBAZ=qux");
  });

  it("handles empty entries", () => {
    expect(formatEnvOutput([])).toBe("");
  });
});

describe("runEnv", () => {
  it("prints dotenv format by default", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runEnv();
    expect(consoleSpy).toHaveBeenCalledWith("API_KEY=secret123\nDB_URL=postgres://localhost/db");
    consoleSpy.mockRestore();
  });

  it("prints json format when requested", async () => {
    vi.mocked(encrypt.decryptWithPrivateKey)
      .mockReturnValueOnce("secret123")
      .mockReturnValueOnce("postgres://localhost/db");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runEnv({ format: "json" });
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.API_KEY).toBe("secret123");
    consoleSpy.mockRestore();
  });

  it("prints export format when requested", async () => {
    vi.mocked(encrypt.decryptWithPrivateKey)
      .mockReturnValueOnce("secret123")
      .mockReturnValueOnce("postgres://localhost/db");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runEnv({ format: "export" });
    expect(consoleSpy).toHaveBeenCalledWith(
      'export API_KEY="secret123"\nexport DB_URL="postgres://localhost/db"'
    );
    consoleSpy.mockRestore();
  });
});
