# envault compare

Compare two vault files to identify differences in keys and values.

## Usage

```bash
envault compare <vault-a> <vault-b>
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `vault-a` | Path to the first vault JSON file  |
| `vault-b` | Path to the second vault JSON file |

## Output

The command displays a diff-style summary:

- Lines prefixed with `-` indicate keys only present in `vault-a`
- Lines prefixed with `+` indicate keys only present in `vault-b`
- Lines prefixed with `~` indicate keys present in both but with different encrypted values
- A count of matching (identical) keys is shown at the end

## Example

```bash
envault compare .envault/staging.json .envault/production.json
```

```
Only in staging:
  - DEBUG_MODE
Only in production:
  + SENTRY_DSN
Different values:
  ~ DATABASE_URL
  ~ REDIS_URL

Matching keys: 5
```

## Notes

- Comparison is based on encrypted values; two vaults may have the same plaintext but differ if encrypted with different public keys.
- Use `envault diff` to compare a vault against a local `.env` file instead.
- Both vault files must be valid JSON vault files created by `envault push`.
