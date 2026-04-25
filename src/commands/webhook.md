# `envault webhook` — Webhook Notifications

Register HTTP webhooks to receive real-time notifications when vault events occur (push, pull, rotate, share, etc.).

## Usage

```bash
# Register a webhook
envault webhook add <name> <url> [events] [secret]

# Remove a webhook
envault webhook remove <name>

# List registered webhooks
envault webhook list
```

## Arguments

| Argument  | Description                                              |
|-----------|----------------------------------------------------------|
| `name`    | Unique name for the webhook                              |
| `url`     | HTTP or HTTPS endpoint to POST events to                 |
| `events`  | Comma-separated list of events, or `*` for all (default) |
| `secret`  | Optional shared secret sent as `X-Envault-Secret` header |

## Supported Events

- `push` — triggered when secrets are pushed to the vault
- `pull` — triggered when secrets are pulled
- `rotate` — triggered on key rotation
- `share` — triggered when vault is shared with a user
- `unshare` — triggered when access is revoked
- `*` — wildcard, matches all events

## Payload Format

Each webhook POST contains a JSON body:

```json
{
  "event": "push",
  "payload": { "key": "API_KEY" },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Examples

```bash
# Notify Slack on all events
envault webhook add slack https://hooks.slack.com/services/xxx "*"

# Notify CI on push only
envault webhook add ci https://ci.example.com/envault push

# Register with secret for verification
envault webhook add secure https://api.example.com/hook push,rotate my-secret

# Remove a webhook
envault webhook remove slack
```

## Storage

Webhook configurations are stored in `.envault/webhooks.json`. This file should be added to `.gitignore` if secrets are included.
