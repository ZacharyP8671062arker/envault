# `envault pin` — Pin Vault Keys

Mark specific vault keys as **pinned** to protect them from accidental deletion, rotation, or cleanup operations.

## Usage

```bash
envault pin add <key> [note]
envault pin remove <key>
envault pin list
```

## Subcommands

### `pin add <key> [note]`

Pin a vault key, optionally attaching a short note explaining why.

```bash
envault pin add DATABASE_URL "production connection string"
envault pin add STRIPE_SECRET_KEY
```

### `pin remove <key>`

Remove the pin from a key, allowing it to be modified or deleted again.

```bash
envault pin remove DATABASE_URL
```

### `pin list`

List all currently pinned keys along with their notes and pin timestamps.

```bash
envault pin list
```

Example output:

```
Pinned keys:
  DATABASE_URL  # production connection string  (pinned 2024-06-01T10:00:00.000Z)
  STRIPE_SECRET_KEY  (pinned 2024-06-02T08:30:00.000Z)
```

## Storage

Pin metadata is stored in `.envault/pins.json` and **should be committed** to your repository so the entire team shares the same pinned keys.

## Integration

Pinned keys are respected by the following commands:

- `envault clean` — skips pinned keys when removing orphaned entries
- `envault rotate` — warns before rotating a pinned key
- `envault rollback` — skips overwriting pinned keys unless `--force` is passed

## Notes

- Pinning a key does **not** encrypt or otherwise modify the key's value.
- A key can only be pinned once; pinning an already-pinned key is a no-op.
