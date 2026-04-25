import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  loadSchema,
  saveSchema,
  addSchemaField,
  removeSchemaField,
  validateAgainstSchema,
} from "./schema";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-schema-test-"));
}

describe("schema", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("loadSchema returns empty fields when no file exists", () => {
    const schema = loadSchema(tmpDir);
    expect(schema.fields).toEqual([]);
  });

  test("saveSchema and loadSchema round-trip", () => {
    const schema = { fields: [{ key: "API_KEY", required: true, description: "API key" }] };
    saveSchema(schema, tmpDir);
    const loaded = loadSchema(tmpDir);
    expect(loaded.fields).toHaveLength(1);
    expect(loaded.fields[0].key).toBe("API_KEY");
  });

  test("addSchemaField adds a new field", () => {
    const schema = addSchemaField({ key: "DB_URL", required: true }, tmpDir);
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].key).toBe("DB_URL");
  });

  test("addSchemaField updates existing field", () => {
    addSchemaField({ key: "DB_URL", required: true }, tmpDir);
    const schema = addSchemaField({ key: "DB_URL", required: false, description: "updated" }, tmpDir);
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].required).toBe(false);
    expect(schema.fields[0].description).toBe("updated");
  });

  test("removeSchemaField removes a field", () => {
    addSchemaField({ key: "API_KEY", required: true }, tmpDir);
    addSchemaField({ key: "SECRET", required: false }, tmpDir);
    const schema = removeSchemaField("API_KEY", tmpDir);
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].key).toBe("SECRET");
  });

  test("validateAgainstSchema passes when all required keys present", () => {
    const schema = { fields: [{ key: "API_KEY", required: true }] };
    const result = validateAgainstSchema({ API_KEY: "abc123" }, schema);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  test("validateAgainstSchema reports missing required keys", () => {
    const schema = { fields: [{ key: "API_KEY", required: true }] };
    const result = validateAgainstSchema({}, schema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("API_KEY");
  });

  test("validateAgainstSchema reports pattern mismatches", () => {
    const schema = {
      fields: [{ key: "PORT", required: true, pattern: "^\\d+$" }],
    };
    const result = validateAgainstSchema({ PORT: "not-a-number" }, schema);
    expect(result.valid).toBe(false);
    expect(result.patternMismatches).toHaveLength(1);
    expect(result.patternMismatches[0].key).toBe("PORT");
  });

  test("validateAgainstSchema passes pattern when value matches", () => {
    const schema = {
      fields: [{ key: "PORT", required: true, pattern: "^\\d+$" }],
    };
    const result = validateAgainstSchema({ PORT: "3000" }, schema);
    expect(result.valid).toBe(true);
  });
});
