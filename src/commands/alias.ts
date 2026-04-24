import * as fs from "fs";
import * as path from "path";

const ALIAS_FILE = ".envault/aliases.json";

export interface AliasMap {
  [alias: string]: string;
}

export function loadAliases(): AliasMap {
  if (!fs.existsSync(ALIAS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ALIAS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveAliases(aliases: AliasMap): void {
  const dir = path.dirname(ALIAS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ALIAS_FILE, JSON.stringify(aliases, null, 2));
}

export function setAlias(alias: string, key: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    throw new Error(`Invalid alias "${alias}": only alphanumeric, underscores, and hyphens allowed.`);
  }
  const aliases = loadAliases();
  aliases[alias] = key;
  saveAliases(aliases);
}

export function removeAlias(alias: string): void {
  const aliases = loadAliases();
  if (!(alias in aliases)) {
    throw new Error(`Alias "${alias}" not found.`);
  }
  delete aliases[alias];
  saveAliases(aliases);
}

export function resolveAlias(aliasOrKey: string): string {
  const aliases = loadAliases();
  return aliases[aliasOrKey] ?? aliasOrKey;
}

export function runAlias(args: string[]): void {
  const subcommand = args[0];

  if (subcommand === "set" && args[1] && args[2]) {
    setAlias(args[1], args[2]);
    console.log(`Alias "${args[1]}" -> "${args[2]}" saved.`);
  } else if (subcommand === "remove" && args[1]) {
    removeAlias(args[1]);
    console.log(`Alias "${args[1]}" removed.`);
  } else if (subcommand === "list" || !subcommand) {
    const aliases = loadAliases();
    const entries = Object.entries(aliases);
    if (entries.length === 0) {
      console.log("No aliases defined.");
    } else {
      entries.forEach(([alias, key]) => console.log(`${alias} -> ${key}`));
    }
  } else {
    console.error("Usage: envault alias set <alias> <key>");
    console.error("       envault alias remove <alias>");
    console.error("       envault alias list");
    process.exit(1);
  }
}
