import * as fs from "fs";
import * as path from "path";
import { parseEnvKeys, checkEnvAgainstVault, runEnvCheck } from "./env-check";
import { saveVault } from "./add";

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("parseEnvKeys", () => {
  it("returns keys from a valid .env file", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("API_KEY=abc\nDB_URL=postgres://localhost\n# comment\n");
    const keys = parseEnvKeys(".env");
    expect(keys).toEqual(["API_KEY", "DB_URL"]);
  });

  it("returns empty array if file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const keys = parseEnvKeys(".env");
    expect(keys).toEqual([]);
  });

  it("ignores comment lines", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("# this is a comment\nSECRET=value\n");
    const keys = parseEnvKeys(".env");
    expect(keys).toEqual(["SECRET"]);
  });
});

describe("checkEnvAgainstVault", () => {
  beforeEach(() => {
    mockFs.existsSync.mockReturnValue(true);
  });

  it("identifies matched, missing, and extra keys", () => {
    mockFs.readFileSync
      .mockReturnValueOnce("API_KEY=abc\nDB_URL=postgres\n")
      .mockReturnValueOnce(JSON.stringify({ API_KEY: "enc1", SECRET: "enc2" }));

    const result = checkEnvAgainstVault(".env", ".envault/vault.json");
    expect(result.matched).toContain("API_KEY");
    expect(result.missing).toContain("SECRET");
    expect(result.extra).toContain("DB_URL");
  });

  it("returns all matched when env and vault align", () => {
    mockFs.readFileSync
      .mockReturnValueOnce("FOO=1\nBAR=2\n")
      .mockReturnValueOnce(JSON.stringify({ FOO: "enc1", BAR: "enc2" }));

    const result = checkEnvAgainstVault(".env", ".envault/vault.json");
    expect(result.matched).toEqual(expect.arrayContaining(["FOO", "BAR"]));
    expect(result.missing).toHaveLength(0);
    expect(result.extra).toHaveLength(0);
  });
});

describe("runEnvCheck", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  const errorSpy = jest.spyOn(console, "error").mockImplementation();

  afterEach(() => jest.clearAllMocks());

  it("exits with error if vault does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runEnvCheck()).toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
  });

  it("prints sync message when env matches vault", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce("FOO=1\n")
      .mockReturnValueOnce(JSON.stringify({ FOO: "enc" }));
    runEnvCheck(".env", ".envault/vault.json");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("in sync"));
  });
});
