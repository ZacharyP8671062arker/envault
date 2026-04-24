# `envault expire` — Key Expiry Management

The `expire` command lets you set time-based expiry on vault keys. Expired keys can be listed or automatically purged.

## Usage

```bash
# Set a key to expire in N days
envault expire set <key> --days <n>

# Clear expiry for a key
envault expire clear <key>

# List all expired keys
envault expire check

# Remove all expired keys from the vault
envault expire purge
```

## Examples

```bash
# Expire API_KEY in 90 days
envault expire set API_KEY --days 90

# Check which keys have expired
envault expire check

# Purge all expired keys
envault expire purge
```

## How It Works

Expiry metadata is stored in `.envault/expire.json` alongside your vault. Each entry maps a key name to an ISO 8601 expiry timestamp.

```json
{
  "API_KEY": "2025-09-01T00:00:00.000Z",
  "OLD_TOKEN": "2024-01-15T00:00:00.000Z"
}
```

## Notes

- Expiry metadata is separate from the encrypted vault; keys are not automatically removed until you run `expire purge`.
- Use `expire check` in CI pipelines to catch stale credentials before they cause issues.
- Combine with `envault audit` to track when keys were purged.
