import * as fs from "fs";
import * as path from "path";
import { cloneVault } from "./clone";
import { saveVault, loadVault } from "./add";
import { logAction } from "../crypto/auditLogger";

jest.mock("../crypto/auditLogger", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../crypto/keyPair", () => ({
  loadPublicKey: jest.fn().mockReturnValue("mock-public-key"),
}));

jest.mock("./add", () => ({
  loadVault: jest.fn(),
  saveVault: jest.fn(),
}));

const mockLoadVault = loadVault as jest.Mock;
const mockSaveVault = saveVault as jest.Mock;
const mockLogAction = logAction as jest.Mock;

describe("cloneVault", () => {
  const sourceVault = ".envault/vault.json";
  const targetVault = ".envault/vault-clone.json";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p === sourceVault) return true;
      if (p === targetVault) return false;
      if (p === ".envault/keys/alice.pub") return true;
      if (p === ".envault") return true;
      return false;
    });
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
    mockLoadVault.mockReturnValue({
      entries: { DB_URL: "encrypted-value" },
      sharedWith: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("clones a vault to a new path", async () => {
    await cloneVault({ sourceVault, targetVault });
    expect(mockLoadVault).toHaveBeenCalledWith(sourceVault);
    expect(mockSaveVault).toHaveBeenCalledWith(
      targetVault,
      expect.objectContaining({ entries: { DB_URL: "encrypted-value" } })
    );
    expect(mockLogAction).toHaveBeenCalledWith("clone", expect.objectContaining({ source: sourceVault, target: targetVault }));
  });

  it("adds userId to sharedWith when provided", async () => {
    await cloneVault({ sourceVault, targetVault, userId: "alice" });
    expect(mockSaveVault).toHaveBeenCalledWith(
      targetVault,
      expect.objectContaining({ sharedWith: ["alice"] })
    );
  });

  it("throws if source vault does not exist", async () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    await expect(
      cloneVault({ sourceVault: "missing.json", targetVault })
    ).rejects.toThrow("Source vault not found");
  });

  it("throws if target vault already exists", async () => {
    jest.spyOn(fs, "existsSync").mockImplementation((p) => {
      return p === sourceVault || p === targetVault;
    });
    await expect(
      cloneVault({ sourceVault, targetVault })
    ).rejects.toThrow("Target vault already exists");
  });
});
