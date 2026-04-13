# `envault env` — Decrypt and Print Environment Variables

The `env` command decrypts all entries in the vault using your private key and outputs them in a usable format.

## Usage

```bash
envault env [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--format` | Output format: `dotenv`, `json`, `export` | `dotenv` |
| `--output <file>` | Write output to a file instead of stdout | stdout |

## Examples

### Print as dotenv

```bash
envault env
# API_KEY=secret123
# DB_URL=postgres://localhost/mydb
```

### Print as shell exports

```bash
envault env --format export
# export API_KEY="secret123"
# export DB_URL="postgres://localhost/mydb"
```

### Print as JSON

```bash
envault env --format json
# {
#   "API_KEY": "secret123",
#   "DB_URL": "postgres://localhost/mydb"
# }
```

### Write to a file

```bash
envault env --output .env
# Decrypted env written to .env
```

## Notes

- Your private key must be present at `.envault/private.key` (or unlocked via `envault unlock`).
- The `.env` output file should be listed in `.gitignore` to avoid committing secrets.
- Use `envault diff` to compare vault contents with an existing `.env` file.
