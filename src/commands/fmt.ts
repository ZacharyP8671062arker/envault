import * as fs from "fs";
import * as path from "path";

export interface FmtOptions {
  sort?: boolean;
  stripComments?: boolean;
  trimValues?: boolean;
}

export function formatEnvContent(content: string, options: FmtOptions = {}): string {
  const lines = content.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      result.push("");
      continue;
    }

    if (trimmed.startsWith("#")) {
      if (!options.stripComments) {
        result.push(trimmed);
      }
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      result.push(trimmed);
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1);

    if (options.trimValues) {
      value = value.trim();
    }

    result.push(`${key}=${value}`);
  }

  const entries = result.filter((l) => l.includes("="));
  const nonEntries = result.filter((l) => !l.includes("="));

  if (options.sort) {
    entries.sort((a, b) => a.localeCompare(b));
    const sorted = [...nonEntries.filter((l) => l === ""), ...entries];
    return sorted.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function runFmt(filePath: string, options: FmtOptions = {}): void {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolved);
  if (!stats.isFile()) {
    console.error(`Not a file: ${resolved}`);
    process.exit(1);
  }

  const original = fs.readFileSync(resolved, "utf-8");
  const formatted = formatEnvContent(original, options);

  if (original === formatted) {
    console.log(`Already formatted: ${filePath}`);
    return;
  }

  fs.writeFileSync(resolved, formatted, "utf-8");
  console.log(`Formatted: ${filePath}`);
}
