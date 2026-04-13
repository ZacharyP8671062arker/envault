# `envault diff`

Compare the current `.env` file against the encrypted vault to see what has changed.

## Usage

```bash
envault diff [env-file]
```

### Arguments

| Argument   | Description                          | Default |
|------------|--------------------------------------|---------|
| `env-file` | Path to the local env file to compare | `.env`  |

## Output

The diff command shows three categories of changes:

- **`+` Added** — Keys present in your local `.env` but not yet pushed to the vault.
- **`-` Removed** — Keys in the vault that no longer exist in your local `.env`.
- **`~` Changed** — Keys that exist in both but have different values.

If there are no differences, the command prints a confirmation message.

## Example

```bash
$ envault diff

+ Keys in local but not in vault:
  + NEW_FEATURE_FLAG

~ Keys with different values:
  ~ DATABASE_URL
  ~ API_SECRET

- Keys in vault but not in local:
  - DEPRECATED_KEY
```

## Notes

- Your private key must be available (unlocked) to decrypt vault values for comparison.
- Value contents are compared but **not displayed** to avoid leaking secrets in terminal output.
- Run `envault push` after reviewing the diff to sync changes to the vault.
