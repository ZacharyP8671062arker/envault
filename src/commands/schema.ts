import * as fs from "fs";
import * as path from "path";

export interface SchemaField {
  key: string;
  required: boolean;
  description?: string;
  pattern?: string;
  example?: string;
}

export interface EnvSchema {
  fields: SchemaField[];
}

const SCHEMA_FILE = ".envault-schema.json";

export function loadSchema(dir: string = process.cwd()): EnvSchema {
  const schemaPath = path.join(dir, SCHEMA_FILE);
  if (!fs.existsSync(schemaPath)) {
    return { fields: [] };
  }
  const raw = fs.readFileSync(schemaPath, "utf-8");
  return JSON.parse(raw) as EnvSchema;
}

export function saveSchema(schema: EnvSchema, dir: string = process.cwd()): void {
  const schemaPath = path.join(dir, SCHEMA_FILE);
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), "utf-8");
}

export function addSchemaField(field: SchemaField, dir?: string): EnvSchema {
  const schema = loadSchema(dir);
  const existing = schema.fields.findIndex((f) => f.key === field.key);
  if (existing >= 0) {
    schema.fields[existing] = field;
  } else {
    schema.fields.push(field);
  }
  saveSchema(schema, dir);
  return schema;
}

export function removeSchemaField(key: string, dir?: string): EnvSchema {
  const schema = loadSchema(dir);
  schema.fields = schema.fields.filter((f) => f.key !== key);
  saveSchema(schema, dir);
  return schema;
}

export interface SchemaValidationResult {
  valid: boolean;
  missing: string[];
  patternMismatches: { key: string; pattern: string }[];
}

export function validateAgainstSchema(
  envKeys: Record<string, string>,
  schema: EnvSchema
): SchemaValidationResult {
  const missing: string[] = [];
  const patternMismatches: { key: string; pattern: string }[] = [];

  for (const field of schema.fields) {
    const value = envKeys[field.key];
    if (field.required && (value === undefined || value === "")) {
      missing.push(field.key);
      continue;
    }
    if (value !== undefined && field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        patternMismatches.push({ key: field.key, pattern: field.pattern });
      }
    }
  }

  return {
    valid: missing.length === 0 && patternMismatches.length === 0,
    missing,
    patternMismatches,
  };
}

export function runSchemaValidate(envKeys: Record<string, string>, dir?: string): void {
  const schema = loadSchema(dir);
  if (schema.fields.length === 0) {
    console.log("No schema defined. Run `envault schema add` to define fields.");
    return;
  }
  const result = validateAgainstSchema(envKeys, schema);
  if (result.valid) {
    console.log("✔ All schema constraints satisfied.");
  } else {
    if (result.missing.length > 0) {
      console.error("✘ Missing required keys:", result.missing.join(", "));
    }
    for (const mm of result.patternMismatches) {
      console.error(`✘ Key "${mm.key}" does not match pattern: ${mm.pattern}`);
    }
    process.exit(1);
  }
}
