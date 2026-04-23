# `envault merge` — Merge Two Vaults

Merge secrets from a source vault file into your current vault, with configurable conflict resolution strategies.

## Usage

```bash
envault merge <source-vault-path> [--strategy <ours|theirs>]
```

## Arguments

| Argument | Description |
|---|---|
| `source-vault-path` | Path to the `.vault.json` file to merge from |

## Options

| Flag | Default | Description |
|---|---|---|
| `--strategy` | `ours` | Conflict resolution strategy: `ours` or `theirs` |

## Merge Strategies

### `ours` (default)
Keeps the current vault's value when a key exists in both vaults with different values.

```bash
envault merge /path/to/other.vault.json --strategy ours
```

### `theirs`
Overwrites the current vault's value with the incoming value when a conflict is detected.

```bash
envault merge /path/to/other.vault.json --strategy theirs
```

## Output

After merging, a summary is printed:

```
Merge complete (strategy: ours)
  Added:    NEW_VAR, ANOTHER_VAR
  Updated:  (none)
  Skipped:  API_KEY, DB_HOST
```

## Audit Log

All merge operations are recorded in the audit log with the strategy used and a summary of changes.

## Notes

- Keys present only in the source vault are always added.
- Keys with identical values in both vaults are silently skipped.
- The source vault file is not modified.
