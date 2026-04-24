# `envault notes` — Annotate Vault Keys

The `notes` command lets you attach human-readable annotations to individual vault keys. Notes are stored locally in `.envault/notes.json` and are useful for documenting the purpose, origin, or usage constraints of a secret.

## Usage

```bash
envault notes set <key> <note> [--author <name>]
envault notes get <key>
envault notes remove <key>
envault notes list
```

## Commands

### `set`
Attach or update a note for the given key.

```bash
envault notes set API_KEY "Used for Stripe webhook authentication" --author alice
```

### `get`
Retrieve the note for a specific key.

```bash
envault notes get API_KEY
# [API_KEY] Used for Stripe webhook authentication (by alice) — 2024-06-01T10:00:00.000Z
```

### `remove`
Delete the note associated with a key.

```bash
envault notes remove API_KEY
```

### `list`
List all notes across all annotated keys.

```bash
envault notes list
```

## Storage

Notes are saved to `.envault/notes.json`. This file is **not encrypted** and should not contain sensitive information — only descriptive metadata about keys.

It is recommended to commit `notes.json` to version control so annotations are shared across your team.

## Notes File Format

```json
{
  "API_KEY": {
    "key": "API_KEY",
    "note": "Used for Stripe webhook authentication",
    "author": "alice",
    "updatedAt": "2024-06-01T10:00:00.000Z"
  }
}
```
