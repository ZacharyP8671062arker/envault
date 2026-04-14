# `envault snapshot`

Create and manage point-in-time snapshots of your vault state.

Snapshots capture the full encrypted vault contents at a given moment, allowing you to restore or compare vault state over time.

## Usage

```bash
envault snapshot create [label]
envault snapshot list
envault snapshot delete <id>
```

## Subcommands

### `create [label]`

Captures the current vault state as a new snapshot.

```bash
envault snapshot create before-deploy
# Snapshot created: k9x2a4bf ("before-deploy")
```

- `label` — Optional human-readable name for the snapshot (default: `unnamed`)
- Snapshots are stored in `.envault/snapshots/`

### `list`

Lists all existing snapshots sorted by creation time.

```bash
envault snapshot list
# k9x2a4bf  2024-06-01T12:00:00.000Z  before-deploy
# m3z7q1rp  2024-06-15T09:30:00.000Z  post-migration
```

### `delete <id>`

Permanently removes a snapshot by its ID.

```bash
envault snapshot delete k9x2a4bf
# Deleted snapshot k9x2a4bf.
```

## Storage

Snapshots are saved as individual JSON files under `.envault/snapshots/`. Each file contains:

- `id` — Unique short identifier
- `label` — Human-readable name
- `timestamp` — ISO 8601 creation time
- `vault` — Full encrypted vault contents at time of snapshot

## Notes

- Snapshot contents remain encrypted; private key is still required to read values.
- Snapshots are **not** automatically synced — they are local only.
- Use `envault diff` to compare two vault states.
