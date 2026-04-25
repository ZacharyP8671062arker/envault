# `envault schema` — Env Schema Validation

Define and enforce a schema for your vault's environment variables. This ensures all required keys are present and values conform to expected formats.

## Commands

### `envault schema add <key>`

Add or update a field in the schema.

**Options:**
- `--required` — Mark the key as required (default: false)
- `--description <text>` — Human-readable description of the key
- `--pattern <regex>` — Regex pattern the value must match
- `--example <value>` — Example value shown in docs/errors

**Example:**
```bash
envault schema add API_KEY --required --description "Third-party API key" --pattern "^[A-Za-z0-9]{32}$"
envault schema add PORT --required --pattern "^\d+$" --example "3000"
```

### `envault schema remove <key>`

Remove a field from the schema.

```bash
envault schema remove API_KEY
```

### `envault schema list`

List all fields defined in the schema.

```bash
envault schema list
```

Output:
```
KEY         REQUIRED  PATTERN         DESCRIPTION
API_KEY     yes       ^[A-Za-z0-9]+$  Third-party API key
PORT        yes       ^\d+$           -
DEBUG       no        -               Enable debug mode
```

### `envault schema validate`

Validate the current vault (or a `.env` file) against the schema.

```bash
envault schema validate
envault schema validate --file .env.staging
```

Exits with code `1` if validation fails.

## Schema File

The schema is stored in `.envault-schema.json` at the project root. You should commit this file to version control so all team members share the same constraints.

```json
{
  "fields": [
    { "key": "API_KEY", "required": true, "pattern": "^[A-Za-z0-9]{32}$" },
    { "key": "PORT", "required": true, "pattern": "^\\d+$", "example": "3000" }
  ]
}
```

## Integration with `push` and `pull`

When a schema is present, `envault push` automatically validates the env file before encrypting. Use `--no-schema` to skip validation.
