import * as fs from "fs";
import { loadAliases, saveAliases, setAlias, removeAlias, resolveAlias } from "./alias";

const ALIAS_FILE = ".envault/aliases.json";

jest.mock("fs");

const mockedFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedFs.existsSync.mockReturnValue(false);
});

describe("loadAliases", () => {
  it("returns empty object when file does not exist", () => {
    mockedFs.existsSync.mockReturnValue(false);
    expect(loadAliases()).toEqual({});
  });

  it("parses aliases from file", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ db: "DATABASE_URL" }));
    expect(loadAliases()).toEqual({ db: "DATABASE_URL" });
  });

  it("returns empty object on invalid JSON", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("not-json");
    expect(loadAliases()).toEqual({});
  });
});

describe("setAlias", () => {
  it("saves a new alias", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({}));
    setAlias("db", "DATABASE_URL");
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      ALIAS_FILE,
      JSON.stringify({ db: "DATABASE_URL" }, null, 2)
    );
  });

  it("throws on invalid alias name", () => {
    expect(() => setAlias("my alias!", "KEY")).toThrow("Invalid alias");
  });

  it("overwrites existing alias", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ db: "OLD_KEY" }));
    setAlias("db", "NEW_KEY");
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      ALIAS_FILE,
      JSON.stringify({ db: "NEW_KEY" }, null, 2)
    );
  });
});

describe("removeAlias", () => {
  it("removes an existing alias", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ db: "DATABASE_URL" }));
    removeAlias("db");
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      ALIAS_FILE,
      JSON.stringify({}, null, 2)
    );
  });

  it("throws when alias does not exist", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(() => removeAlias("ghost")).toThrow('Alias "ghost" not found.');
  });
});

describe("resolveAlias", () => {
  it("resolves a known alias to its key", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ db: "DATABASE_URL" }));
    expect(resolveAlias("db")).toBe("DATABASE_URL");
  });

  it("returns the original string when no alias matches", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(resolveAlias("DATABASE_URL")).toBe("DATABASE_URL");
  });
});
