# `envault tag` — Tag Vault Keys

The `tag` command lets you organize vault entries by attaching named tags to them. This is useful for grouping keys by environment, sensitivity, or service.

## Usage

```bash
envault tag add <tag> <key>
envault tag remove <tag> <key>
envault tag list <tag>
```

## Subcommands

### `add`

Attaches a tag to a vault key.

```bash
envault tag add prod DB_URL
envault tag add critical API_SECRET
```

### `remove`

Removes a tag from a vault key. If no keys remain under the tag, the tag itself is deleted.

```bash
envault tag remove prod DB_URL
```

### `list`

Lists all vault keys associated with a given tag.

```bash
envault tag list prod
# Keys tagged 'prod':
#   - DB_URL
#   - REDIS_URL
```

## Storage

Tags are stored in `.envault/tags.json` as a JSON map of tag names to arrays of key names:

```json
{
  "prod": ["DB_URL", "REDIS_URL"],
  "critical": ["API_SECRET"]
}
```

This file should be committed to version control alongside your vault so the entire team shares tag metadata.

## Notes

- Tags are purely organizational and do not affect encryption or sync behavior.
- A single key can have multiple tags.
- Tags are case-sensitive.
