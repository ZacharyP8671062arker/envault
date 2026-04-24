# `envault lint`

Lint a `.env` file for common formatting and quality issues before encrypting or pushing to the vault.

## Usage

```bash
envault lint [file]
```

- `file` — Path to the `.env` file to lint. Defaults to `.env` in the current directory.

## What It Checks

| Rule | Severity | Description |
|------|----------|-------------|
| Missing `=` separator | error | Every non-comment line must contain an `=` sign. |
| Duplicate keys | error | The same key must not appear more than once. |
| Lowercase / non-standard key names | warning | Keys should be `UPPER_SNAKE_CASE`. |
| Whitespace after `=` | warning | Avoid leading spaces in values (e.g. `KEY= value`). |
| Unquoted values with spaces | warning | Values containing spaces should be wrapped in quotes. |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No errors found (warnings may still be present). |
| `1` | One or more **errors** detected, or file not found. |

## Examples

```bash
# Lint the default .env file
envault lint

# Lint a specific file
envault lint .env.production
```

### Example output

```
⚠  [WARNING] Line 2 (db_host): Key "db_host" should be uppercase with underscores only
✖  [ERROR]   Line 5 (API_KEY): Duplicate key "API_KEY"
⚠  [WARNING] Line 7 (SECRET): Value with spaces should be quoted

1 error(s), 2 warning(s) in .env
```

## Notes

- Comment lines (starting with `#`) and blank lines are ignored.
- It is recommended to run `envault lint` in CI before `envault push` to catch issues early.
