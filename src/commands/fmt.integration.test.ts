import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runFmt } from "./fmt";

function makeTempEnv(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-fmt-"));
  const filePath = path.join(dir, ".env");
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("runFmt integration", () => {
  it("formats a file in place", () => {
    const filePath = makeTempEnv("ZOO=1\nAPP=2\n\n\n\nMID=3\n");
    runFmt(filePath, { sort: true });
    const result = fs.readFileSync(filePath, "utf-8");
    const lines = result.trim().split("\n").filter((l) => l.includes("="));
    expect(lines[0]).toBe("APP=2");
    expect(lines[1]).toBe("MID=3");
    expect(lines[2]).toBe("ZOO=1");
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("reports already formatted when no changes needed", () => {
    const filePath = makeTempEnv("FOO=bar\n");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runFmt(filePath);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Already formatted"));
    consoleSpy.mockRestore();
  });

  it("strips comments when option is set", () => {
    const filePath = makeTempEnv("# secret\nFOO=bar\n");
    runFmt(filePath, { stripComments: true });
    const result = fs.readFileSync(filePath, "utf-8");
    expect(result).not.toContain("# secret");
    expect(result).toContain("FOO=bar");
  });

  it("exits with error for missing file", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    expect(() => runFmt("/nonexistent/.env")).toThrow("process.exit(1)");
    mockExit.mockRestore();
  });
});
