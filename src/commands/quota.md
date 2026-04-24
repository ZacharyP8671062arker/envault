# `envault quota` — Vault Quota Management

Enforce limits on vault size, key count, and value lengths to keep secrets manageable and prevent accidental bloat.

## Usage

```bash
# View current quota configuration
envault quota get

# Set quota limits
envault quota set --max-keys 50
envault quota set --max-value-length 512
envault quota set --max-vault-size-bytes 102400

# Check vault against current quota
envault quota check
```

## Options

| Flag | Description |
|------|-------------|
| `--max-keys <n>` | Maximum number of keys allowed in the vault |
| `--max-value-length <n>` | Maximum character length for any single value |
| `--max-vault-size-bytes <n>` | Maximum total size of the vault in bytes |

## Examples

```bash
# Limit vault to 100 keys with values no longer than 1024 chars
envault quota set --max-keys 100 --max-value-length 1024

# Run a quota check before pushing
envault quota check && envault push
```

## Quota File

Quota configuration is stored in `.envault/quota.json` and should be committed to version control so all team members share the same limits.

```json
{
  "maxKeys": 100,
  "maxValueLength": 1024,
  "maxVaultSizeBytes": 102400
}
```

## Exit Codes

- `0` — All checks passed or config updated successfully
- `1` — One or more quota violations found

## Notes

- Quota checks are advisory by default; use `--strict` in CI to block pushes on violation.
- Combine with `envault lint` and `envault policy check` for a full pre-push validation pipeline.
