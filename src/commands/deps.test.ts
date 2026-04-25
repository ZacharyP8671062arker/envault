import { buildDepGraph, findDependents, detectCycles } from "./deps";

describe("buildDepGraph", () => {
  it("parses simple variable references", () => {
    const env = `BASE_URL=https://example.com\nAPI_URL=\${BASE_URL}/api`;
    const graph = buildDepGraph(env);
    expect(graph["API_URL"]).toContain("BASE_URL");
  });

  it("handles bare dollar references", () => {
    const env = `HOST=localhost\nDSN=$HOST:5432`;
    const graph = buildDepGraph(env);
    expect(graph["DSN"]).toContain("HOST");
  });

  it("ignores comment lines", () => {
    const env = `# This is a comment\nKEY=value`;
    const graph = buildDepGraph(env);
    expect(Object.keys(graph)).not.toContain("# This is a comment");
    expect(graph["KEY"]).toEqual([]);
  });

  it("ignores blank lines", () => {
    const env = `\nKEY=value\n`;
    const graph = buildDepGraph(env);
    expect(Object.keys(graph)).toContain("KEY");
    expect(Object.keys(graph).length).toBe(1);
  });

  it("captures multiple references in one value", () => {
    const env = `FULL_URL=\${SCHEME}://\${HOST}:\${PORT}`;
    const graph = buildDepGraph(env);
    expect(graph["FULL_URL"]).toEqual(["SCHEME", "HOST", "PORT"]);
  });
});

describe("findDependents", () => {
  it("returns keys that depend on the target", () => {
    const graph = {
      A: [],
      B: ["A"],
      C: ["A", "B"],
    };
    expect(findDependents(graph, "A")).toEqual(expect.arrayContaining(["B", "C"]));
  });

  it("returns empty array when no dependents", () => {
    const graph = { A: [], B: ["A"] };
    expect(findDependents(graph, "B")).toEqual([]);
  });
});

describe("detectCycles", () => {
  it("detects a simple cycle", () => {
    const graph = {
      A: ["B"],
      B: ["A"],
    };
    const cycles = detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("returns empty array for acyclic graph", () => {
    const graph = {
      A: [],
      B: ["A"],
      C: ["B"],
    };
    const cycles = detectCycles(graph);
    expect(cycles).toEqual([]);
  });

  it("detects longer cycles", () => {
    const graph = {
      X: ["Y"],
      Y: ["Z"],
      Z: ["X"],
    };
    const cycles = detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });
});
