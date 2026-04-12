import fs from "fs";
import path from "path";
import { runRotate } from "./rotate";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";
import { encryptWithPublicKey } from "../crypto/encrypt";
import { saveVault, loadVault } from "./add";

const VAULT_PATH = path.resolve(".envault", "vault.json");
const KEY_DIR = path.resolve(".envault");

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("runRotate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should exit if vault does not exist", async () => {
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runRotate()).rejects.toThrow("exit");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should exit if private key does not exist", async () => {
    mockFs.existsSync = jest.fn()
      .mockReturnValueOnce(true)   // vault exists
      .mockReturnValueOnce(false); // private key missing

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runRotate()).rejects.toThrow("exit");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Private key not found"));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should log success message after rotation", async () => {
    const { publicKey, privateKey } = generateKeyPair();
    const encryptedValue = encryptWithPublicKey("secret123", publicKey);

    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn()
      .mockReturnValueOnce(privateKey)                          // old private key
      .mockReturnValueOnce(JSON.stringify({ API_KEY: encryptedValue })); // vault

    mockFs.writeFileSync = jest.fn();
    mockFs.mkdirSync = jest.fn();

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runRotate();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Key rotation complete"));
    consoleSpy.mockRestore();
  });
});
