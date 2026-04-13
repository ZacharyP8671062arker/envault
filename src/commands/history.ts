import * as fs from "fs";
import * as path from "path";
import { readAuditLog } from "./audit";

export interface HistoryEntry {
  timestamp: string;
  action: string;
  key?: string;
  user?: string;
  details?: string;
}

export function getKeyHistory(vaultDir: string, keyName: string): HistoryEntry[] {
  const entries = readAuditLog(vaultDir);
  return entries.filter((entry) => entry.key === keyName || entry.details?.includes(keyName));
}

export function formatHistoryEntry(entry: HistoryEntry): string {
  const parts = [entry.timestamp, entry.action];
  if (entry.key) parts.push(`key=${entry.key}`);
  if (entry.user) parts.push(`user=${entry.user}`);
  if (entry.details) parts.push(entry.details);
  return parts.join(" | ");
}

export function runHistory(vaultDir: string, keyName?: string, options: { limit?: number; json?: boolean } = {}): void {
  const allEntries = readAuditLog(vaultDir);

  let entries: HistoryEntry[] = keyName
    ? getKeyHistory(vaultDir, keyName)
    : allEntries;

  if (options.limit && options.limit > 0) {
    entries = entries.slice(-options.limit);
  }

  if (entries.length === 0) {
    console.log(keyName ? `No history found for key: ${keyName}` : "No history found.");
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  console.log(keyName ? `History for key: ${keyName}` : "Vault history:");
  console.log("-".repeat(60));
  for (const entry of entries) {
    console.log(formatHistoryEntry(entry));
  }
}
