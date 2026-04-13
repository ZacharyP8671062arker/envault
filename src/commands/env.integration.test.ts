import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";
import { encryptWithPublicKey } from "../crypto/encrypt";
import { decryptVaultEntries, formatEnvOutput } from "./env";

const TEST_DIR = ".envault-test-env";
const VAULT_PATH = path.join(TEST_DIR, "vault.json");
const PUB_KEY_PATH = path.join(TEST_DIR, "public.key");
const PRIV_KEY_PATH = path.join(TEST_DIR, "private.key");

beforeAll(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  const { publicKey, privateKey } = generateKeyPair();
  saveKeyPair(publicKey, privateKey, PUB_KEY_PATH, PRIV_KEY_PATH);

  const vault: Record<string, string> = {
    SECRET_TOKEN: encryptWithPublicKey("my-secret-token", publicKey),
    DATABASE_URL: encryptWithPublicKey("postgres://user:pass@host/db", publicKey),
  };
  fs.writeFileSync(VAULT_PATH, JSON.stringify(vault, null, 2), "utf-8");
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("env integration", () => {
  it("decrypts vault entries with real keys", async () => {
    const entries = await decryptVaultEntries(VAULT_PATH, PRIV_KEY_PATH);
    expect(entries).toHaveLength(2);
    const keys = entries.map((e) => e.key);
    expect(keys).toContain("SECRET_TOKEN");
    expect(keys).toContain("DATABASE_URL");
  });

  it("correctly decrypts values", async () => {
    const entries = await decryptVaultEntries(VAULT_PATH, PRIV_KEY_PATH);
    const token = entries.find((e) => e.key === "SECRET_TOKEN");
    const dbUrl = entries.find((e) => e.key === "DATABASE_URL");
    expect(token?.value).toBe("my-secret-token");
    expect(dbUrl?.value).toBe("postgres://user:pass@host/db");
  });

  it("formats entries as valid dotenv", async () => {
    const entries = await decryptVaultEntries(VAULT_PATH, PRIV_KEY_PATH);
    const output = formatEnvOutput(entries);
    expect(output).toContain("SECRET_TOKEN=my-secret-token");
    expect(output).toContain("DATABASE_URL=postgres://user:pass@host/db");
  });
});
