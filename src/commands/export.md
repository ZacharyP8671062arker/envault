# `envault export`

Decrypts and exports secrets from the vault to a local `.env` file.

## Usage

```bash
envault export [options]
```

## Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--output <path>` | `-o` | Output file path | `.env` |
| `--environment <name>` | `-e` | Environment to export | `default` |
| `--overwrite` | | Overwrite existing file | `false` |

## Examples

```bash
# Export default environment to .env
envault export

# Export staging environment
envault export --environment staging

# Export to a custom path
envault export --output .env.local

# Overwrite an existing file
envault export --overwrite
```

## Notes

- Requires your private key to be present at `.envault/private.pem`.
- The exported `.env` file should **not** be committed to version control.
- Ensure `.env` is listed in your `.gitignore`.
- Each environment is stored separately in the vault (`default`, `staging`, `production`, etc.).
