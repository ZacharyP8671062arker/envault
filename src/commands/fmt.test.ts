import { formatEnvContent } from "./fmt";

describe("formatEnvContent", () => {
  it("preserves simple key=value lines", () => {
    const input = "FOO=bar\nBAZ=qux\n";
    const result = formatEnvContent(input);
    expect(result).toContain("FOO=bar");
    expect(result).toContain("BAZ=qux");
  });

  it("trims excessive blank lines", () => {
    const input = "FOO=bar\n\n\n\nBAZ=qux\n";
    const result = formatEnvContent(input);
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("strips comments when stripComments=true", () => {
    const input = "# This is a comment\nFOO=bar\n";
    const result = formatEnvContent(input, { stripComments: true });
    expect(result).not.toContain("# This is a comment");
    expect(result).toContain("FOO=bar");
  });

  it("preserves comments when stripComments=false", () => {
    const input = "# keep me\nFOO=bar\n";
    const result = formatEnvContent(input, { stripComments: false });
    expect(result).toContain("# keep me");
  });

  it("trims values when trimValues=true", () => {
    const input = "FOO=  bar  \n";
    const result = formatEnvContent(input, { trimValues: true });
    expect(result).toContain("FOO=bar");
  });

  it("does not trim values when trimValues=false", () => {
    const input = "FOO=  bar  \n";
    const result = formatEnvContent(input, { trimValues: false });
    expect(result).toContain("FOO=  bar  ");
  });

  it("sorts keys alphabetically when sort=true", () => {
    const input = "ZOO=1\nAPP=2\nMID=3\n";
    const result = formatEnvContent(input, { sort: true });
    const lines = result.trim().split("\n").filter((l) => l.includes("="));
    expect(lines[0]).toMatch(/^APP=/);
    expect(lines[1]).toMatch(/^MID=/);
    expect(lines[2]).toMatch(/^ZOO=/);
  });

  it("ends with a newline", () => {
    const input = "FOO=bar";
    const result = formatEnvContent(input);
    expect(result.endsWith("\n")).toBe(true);
  });

  it("handles empty input", () => {
    const result = formatEnvContent("");
    expect(result).toBe("\n");
  });

  it("handles lines without equals sign gracefully", () => {
    const input = "INVALID_LINE\nFOO=bar\n";
    const result = formatEnvContent(input);
    expect(result).toContain("INVALID_LINE");
    expect(result).toContain("FOO=bar");
  });
});
