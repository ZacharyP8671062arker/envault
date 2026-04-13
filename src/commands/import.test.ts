import * as fs from "fs";
import * as path from "path";
import { parseEnvLines, runImport } from "./import";
import { loadVault, saveVault } from "./add";
import { encryptWithPublicKey } from "../crypto/encrypt";
import { loadPublicKey } from "../crypto/keyPair";
import { logAction } from "../crypto/auditLogger";

jest.mock("./add");
jest.mock("../crypto/encrypt");
jest.mock("../crypto/keyPair");
jest.mock("../crypto/auditLogger");
jest.mock("fs");

const mockLoadVault = loadVault as jest.MockedFunction<typeof loadVault>;
const mockSaveVault = saveVault as jest.MockedFunction<typeof saveVault>;
const mockEncrypt = encryptWithPublicKey as jest.MockedFunction<typeof encryptWithPublicKey>;
const mockLoadPublicKey = loadPublicKey as jest.MockedFunction<typeof loadPublicKey>;
const mockLogAction = logAction as jest.MockedFunction<typeof logAction>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe("parseEnvLines", () => {
  it("parses key=value pairs", () => {
    const result = parseEnvLines("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("skips comments and empty lines", () => {
    const result = parseEnvLines("# comment\n\nKEY=value");
    expect(result).toEqual({ KEY: "value" });
  });

  it("handles values with equals signs", () => {
    const result = parseEnvLines("URL=http://example.com?a=1");
    expect(result).toEqual({ URL: "http://example.com?a=1" });
  });
});

describe("runImport", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (mockFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockFs.readFileSync as jest.Mock).mockReturnValue("API_KEY=secret\nDB_URL=postgres://localhost");
    mockLoadPublicKey.mockReturnValue("mock-public-key");
    mockLoadVault.mockReturnValue({});
    mockEncrypt.mockImplementation((val) => `enc:${val}`);
  });

  it("imports all keys when vault is empty", async () => {
    const result = await runImport(".env");
    expect(result.imported).toEqual(["API_KEY", "DB_URL"]);
    expect(result.skipped).toEqual([]);
    expect(mockSaveVault).toHaveBeenCalled();
    expect(mockLogAction).toHaveBeenCalledWith("import", expect.stringContaining("2 key(s)"));
  });

  it("skips keys already in vault", async () => {
    mockLoadVault.mockReturnValue({ API_KEY: "enc:already" });
    const result = await runImport(".env");
    expect(result.imported).toEqual(["DB_URL"]);
    expect(result.skipped).toEqual(["API_KEY"]);
  });

  it("throws if file does not exist", async () => {
    (mockFs.existsSync as jest.Mock).mockReturnValue(false);
    await expect(runImport("missing.env")).rejects.toThrow("File not found");
  });

  it("does not save vault if nothing imported", async () => {
    mockLoadVault.mockReturnValue({ API_KEY: "enc:a", DB_URL: "enc:b" });
    const result = await runImport(".env");
    expect(result.imported).toEqual([]);
    expect(mockSaveVault).not.toHaveBeenCalled();
  });
});
