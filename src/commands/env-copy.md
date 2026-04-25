# env-copy

Copy encrypted keys from one vault to another.

## Usage

```bash
envault env-copy <source-vault> <dest-vault> [keys...] [options]
```

## Arguments

| Argument | Description |
|---|---|
| `source-vault` | Path to the source `.vault.json` file |
| `dest-vault` | Path to the destination `.vault.json` file |
| `keys...` | Optional list of key names to copy. Copies all keys if omitted. |

## Options

| Option | Description |
|---|---|
| `--overwrite` | Overwrite existing keys in the destination vault |
| `--dry-run` | Preview what would be copied without making changes |

## Examples

### Copy all keys

```bash
envault env-copy staging.vault.json production.vault.json
```

### Copy specific keys

```bash
envault env-copy staging.vault.json production.vault.json API_KEY DB_URL
```

### Overwrite existing keys

```bash
envault env-copy staging.vault.json production.vault.json --overwrite
```

### Preview changes without writing

```bash
envault env-copy staging.vault.json production.vault.json --dry-run
```

## Notes

- Keys that do not exist in the source vault are silently skipped.
- Without `--overwrite`, keys already present in the destination vault are skipped.
- Encrypted values are copied as-is; no re-encryption is performed.
- Use `envault diff` afterward to verify the state of both vaults.
