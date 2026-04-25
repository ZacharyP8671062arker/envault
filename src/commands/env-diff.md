# `envault env-diff`

Compare your local `.env` file against the encrypted vault to identify keys that are out of sync.

## Usage

```bash
envault env-diff [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--env <path>` | Path to the `.env` file (default: `.env`) |
| `--vault <path>` | Path to the vault directory (default: `.envault`) |
| `--all` | Also show unchanged keys |

## Output Format

Each line is prefixed with a symbol indicating its diff status:

| Symbol | Meaning |
|--------|---------|
| `+` | Key exists locally but **not** in the vault (added locally) |
| `-` | Key exists in the vault but **not** locally (removed locally) |
| `~` | Key exists in both but values **differ** |
| ` ` | Key is identical (only shown with `--all`) |

## Examples

### Basic diff

```bash
envault env-diff
```

```
+ NEW_API_KEY=abc123
- OLD_SECRET=<removed>
~ DATABASE_URL: "postgres://old" → "postgres://new"
```

### Show all keys including unchanged

```bash
envault env-diff --all
```

### Diff against a specific env file

```bash
envault env-diff --env .env.production
```

## Notes

- Your private key must be unlocked to decrypt vault values for comparison.
- Sensitive values in `changed` entries are shown in plaintext — avoid sharing diff output.
- Use `envault push` to sync local changes into the vault after reviewing the diff.
