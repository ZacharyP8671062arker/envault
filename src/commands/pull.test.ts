import fs from "fs";
import path from "path";
import { runPull } from "./pull";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";

jest.mock("fs");
jest.mock("../crypto/keyPair");
jest.mock("../crypto/encrypt");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLoadPrivateKey = loadPrivateKey as jest.MockedFunction<typeof loadPrivateKey>;
const mockDecrypt = decryptWithPrivateKey as jest.MockedFunction<typeof decryptWithPrivateKey>;

describe("runPull", () => {
  const vault = {
    entries: [
      { key: "API_KEY", encryptedValue: "enc_api" },
      { key: "DB_URL", encryptedValue: "enc_db" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(vault));
    mockFs.writeFileSync = jest.fn();
    mockLoadPrivateKey.mockResolvedValue("fake-private-key");
    mockDecrypt.mockImplementation((enc) => enc.replace("enc_", ""));
  });

  it("writes decrypted env variables to output file", async () => {
    await runPull(".env");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve(process.cwd(), ".env"),
      "API_KEY=api\nDB_URL=db\n",
      "utf-8"
    );
  });

  it("exits if vault file does not exist", async () => {
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(runPull()).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits if private key is not found", async () => {
    mockLoadPrivateKey.mockResolvedValue(null);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(runPull()).rejects.toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("skips entries that fail to decrypt", async () => {
    mockDecrypt.mockImplementationOnce(() => { throw new Error("decrypt error"); });
    mockDecrypt.mockImplementationOnce(() => "db");
    await runPull(".env");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve(process.cwd(), ".env"),
      "DB_URL=db\n",
      "utf-8"
    );
  });
});
