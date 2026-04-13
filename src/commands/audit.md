# `envault audit` Command

The `audit` command displays a log of all actions performed within the vault, helping teams track who changed what and when.

## Usage

```bash
envault audit [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--user <name>` | Filter entries by user |
| `--action <type>` | Filter by action type (push, pull, share, revoke, rotate) |
| `--limit <n>` | Show only the last N entries |

## Examples

```bash
# Show all audit entries
envault audit

# Show last 10 entries
envault audit --limit 10

# Show entries by a specific user
envault audit --user alice

# Show only push actions
envault audit --action push
```

## Audit Log Format

Entries are stored in `.envault/audit.log` as newline-delimited JSON:

```json
{"timestamp":"2024-01-01T12:00:00.000Z","action":"push","user":"alice","target":"API_KEY"}
```

## Notes

- The audit log is local and not synced automatically.
- To clear the log, delete `.envault/audit.log` manually.
- Ensure `.envault/audit.log` is added to `.gitignore` if you do not want to commit it.
