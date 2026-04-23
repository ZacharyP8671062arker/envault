# `envault template` — Vault Key Templates

Templates allow you to define named groups of environment variable keys that can be quickly applied or referenced across projects.

## Subcommands

### `envault template create <name> <key1> [key2 ...]`

Creates a new template with the given name and list of keys.

```bash
envault template create backend DB_HOST DB_PORT API_KEY
# Template "backend" created with keys: DB_HOST, DB_PORT, API_KEY
```

### `envault template list`

Lists all saved templates.

```bash
envault template list
#   backend: [DB_HOST, DB_PORT, API_KEY]
#   frontend: [NEXT_PUBLIC_API_URL, NEXT_PUBLIC_FEATURE_FLAG]
```

### `envault template apply <name>`

Applies a template by resolving its keys against the current vault. Prints any keys defined in the template that are missing from the vault.

```bash
envault template apply backend
# Applied template "backend". Keys: DB_HOST, DB_PORT, API_KEY
```

### `envault template delete <name>`

Removes a template by name.

```bash
envault template delete backend
# Template "backend" deleted.
```

## Storage

Templates are stored in `.envault/templates.json` and should be committed to version control so all team members share the same template definitions.

## Use Cases

- Define a `backend` template for all server-side secrets.
- Define a `ci` template for CI/CD pipeline variables.
- Quickly validate that all required keys exist in the vault before deployment.
