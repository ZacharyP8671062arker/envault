# `envault env-validate`

Validate a `.env` file against the schema defined in your vault.

## Usage

```bash
envault env-validate <envFile> [options]
```

## Arguments

| Argument   | Description                        |
|------------|------------------------------------|
| `envFile`  | Path to the `.env` file to validate |

## Options

| Flag            | Default       | Description                    |
|-----------------|---------------|--------------------------------|
| `-d, --dir`     | `process.cwd()` | Vault directory containing schema |

## Examples

```bash
# Validate .env in the current directory
envault env-validate .env

# Validate against a specific vault directory
envault env-validate .env.production --dir ./vault
```

## How It Works

1. Reads the `.env` file and parses all `KEY=VALUE` pairs.
2. Loads the schema from the vault directory (see `envault schema`).
3. Checks each schema field against the env values:
   - **required**: key must be present and non-empty
   - **type**: `string`, `number`, or `boolean` type coercion check
   - **pattern**: value must match the provided regex pattern
4. Prints a pass/fail result per key and exits with code `1` if any check fails.

## Exit Codes

| Code | Meaning                          |
|------|----------------------------------|
| `0`  | All validations passed           |
| `1`  | One or more validations failed   |

## Related Commands

- [`envault schema`](./schema.md) — Define the schema for your vault
- [`envault env-check`](./env-check.ts) — Check env keys against vault contents
- [`envault lint`](./lint.md) — Lint `.env` file formatting
