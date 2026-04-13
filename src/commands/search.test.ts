import { searchVault } from "./search";
import * as addModule from "./add";
import * as keyPairModule from "../crypto/keyPair";
import * as encryptModule from "../crypto/encrypt";

jest.mock("./add");
jest.mock("../crypto/keyPair");
jest.mock("../crypto/encrypt");

const mockLoadVault = addModule.loadVault as jest.Mock;
const mockLoadPrivateKey = keyPairModule.loadPrivateKey as jest.Mock;
const mockDecrypt = encryptModule.decryptWithPrivateKey as jest.Mock;

describe("searchVault", () => {
  const vaultPath = "/fake/.envault/vault.json";
  const keyPath = "/fake/.envault/private.pem";

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPrivateKey.mockReturnValue("mock-private-key");
    mockLoadVault.mockReturnValue({
      encKey1: "encVal1",
      encKey2: "encVal2",
      encKey3: "encVal3",
    });
    mockDecrypt
      .mockReturnValueOnce("DATABASE_URL")
      .mockReturnValueOnce("postgres://localhost/db")
      .mockReturnValueOnce("API_KEY")
      .mockReturnValueOnce("secret-api-key-123")
      .mockReturnValueOnce("REDIS_URL")
      .mockReturnValueOnce("redis://localhost:6379");
  });

  it("finds matches by key", async () => {
    const results = await searchVault(vaultPath, keyPath, "DATABASE");
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("DATABASE_URL");
    expect(results[0].matchedOn).toBe("key");
  });

  it("finds matches by value when searchValues is true", async () => {
    const results = await searchVault(vaultPath, keyPath, "secret", { searchValues: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("API_KEY");
    expect(results[0].matchedOn).toBe("value");
  });

  it("does not search values by default", async () => {
    const results = await searchVault(vaultPath, keyPath, "postgres");
    expect(results).toHaveLength(0);
  });

  it("is case-insensitive by default", async () => {
    const results = await searchVault(vaultPath, keyPath, "database_url");
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("DATABASE_URL");
  });

  it("respects caseSensitive option", async () => {
    const results = await searchVault(vaultPath, keyPath, "database_url", { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it("returns empty array when no matches found", async () => {
    const results = await searchVault(vaultPath, keyPath, "NONEXISTENT");
    expect(results).toHaveLength(0);
  });

  it("skips entries that fail to decrypt", async () => {
    mockDecrypt
      .mockReset()
      .mockImplementationOnce(() => { throw new Error("decrypt failed"); })
      .mockReturnValueOnce("API_KEY")
      .mockReturnValueOnce("secret")
      .mockReturnValueOnce("REDIS_URL")
      .mockReturnValueOnce("redis://localhost");

    const results = await searchVault(vaultPath, keyPath, "API");
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("API_KEY");
  });
});
