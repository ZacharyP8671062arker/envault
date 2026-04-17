# `envault watch`

Automatically syncs your `.env` file to the vault whenever it changes on disk.

## Usage

```bash
envault watch [env-file]
```

### Arguments

| Argument   | Default | Description                        |
|------------|---------|------------------------------------|
| `env-file` | `.env`  | Path to the env file to watch      |

## Description

The `watch` command monitors a `.env` file for changes using `fs.watch`. When a change is detected, it:

1. Reads and parses the updated `.env` file.
2. Encrypts each value using your stored public key.
3. Updates the vault with the new encrypted values.
4. Appends an audit log entry for the sync event.

This is useful during active development when you frequently update environment variables and want the vault to stay in sync automatically.

## Example

```bash
# Watch the default .env file
envault watch

# Watch a custom env file
envault watch .env.local
```

## Notes

- Changes are debounced by 300ms to avoid redundant syncs on rapid saves.
- The command runs continuously until interrupted (`Ctrl+C`).
- Requires a valid key pair to be initialized (`envault init`).
- Only keys present in the `.env` file at the time of change are updated; existing vault keys not in the file are preserved.
