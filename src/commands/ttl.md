# `envault ttl` — Time-to-Live for Vault Keys

The `ttl` command lets you assign an automatic expiry duration to individual vault keys. Once a key's TTL has elapsed, it can be pruned from the vault automatically.

## Usage

```bash
envault ttl set <key> <seconds>
envault ttl clear <key>
envault ttl prune
envault ttl list
```

## Subcommands

### `set <key> <seconds>`

Assigns a TTL (in seconds) to the specified key. The expiry timestamp is calculated from the moment the command is run.

```bash
envault ttl set API_TOKEN 3600
# TTL set for "API_TOKEN": expires at 2024-06-01T13:00:00.000Z
```

### `clear <key>`

Removes the TTL for a key without deleting the key itself from the vault.

```bash
envault ttl clear API_TOKEN
# TTL cleared for "API_TOKEN".
```

### `prune`

Scans all TTL entries and removes any keys from the vault whose TTL has expired. This is safe to run repeatedly and can be scheduled as a cron job.

```bash
envault ttl prune
# Pruned 2 expired key(s): OLD_SECRET, TEMP_TOKEN
```

### `list`

Displays all keys with an active TTL, showing their expiry timestamps and current status.

```bash
envault ttl list
#   [active]  API_TOKEN  — expires 2024-06-01T13:00:00.000Z
#   [EXPIRED] OLD_SECRET — expires 2024-05-30T08:00:00.000Z
```

## Storage

TTL metadata is stored in `.envault/ttl.json` and is separate from the encrypted vault file. This file should be committed to version control so the team shares TTL awareness.

## Notes

- TTL values are in **seconds**.
- `prune` must be run explicitly; keys are not removed automatically at runtime.
- Use `envault expire` for calendar-based expiry; use `ttl` for duration-based expiry.
