import * as fs from "fs";
import * as path from "path";
import { loadVault } from "./add";

export interface DepGraph {
  [key: string]: string[];
}

export function buildDepGraph(envContent: string): DepGraph {
  const graph: DepGraph = {};
  const lines = envContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    const refs: string[] = [];
    const refPattern = /\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g;
    let match: RegExpExecArray | null;
    while ((match = refPattern.exec(value)) !== null) {
      refs.push(match[1] || match[2]);
    }

    graph[key] = refs;
  }

  return graph;
}

export function findDependents(graph: DepGraph, targetKey: string): string[] {
  return Object.entries(graph)
    .filter(([, deps]) => deps.includes(targetKey))
    .map(([key]) => key);
}

export function detectCycles(graph: DepGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    for (const dep of graph[node] || []) {
      if (graph[dep] !== undefined) {
        dfs(dep, [...path, node]);
      }
    }

    stack.delete(node);
  }

  for (const key of Object.keys(graph)) {
    dfs(key, []);
  }

  return cycles;
}

export function runDeps(vaultPath: string, key: string): void {
  if (!fs.existsSync(vaultPath)) {
    console.error("Vault not found.");
    process.exit(1);
  }

  const vault = loadVault(vaultPath);
  const envLines = Object.entries(vault)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const graph = buildDepGraph(envLines);

  const deps = graph[key] || [];
  const dependents = findDependents(graph, key);
  const cycles = detectCycles(graph);

  console.log(`Dependencies of ${key}:`, deps.length ? deps.join(", ") : "none");
  console.log(`Keys depending on ${key}:`, dependents.length ? dependents.join(", ") : "none");

  if (cycles.length > 0) {
    console.warn("Cycles detected:", cycles.map(c => c.join(" -> ")).join("; "));
  }
}
