# `envault alias` — Key Aliasing

The `alias` command lets you define short, memorable names for vault keys. Aliases are resolved transparently when used with other commands like `get`, `push`, and `pull`.

## Usage

```bash
envault alias set <alias> <key>
envault alias remove <alias>
envault alias list
```

## Subcommands

### `set`

Create or overwrite an alias mapping.

```bash
envault alias set db DATABASE_URL
envault alias set secret JWT_SECRET
```

### `remove`

Delete an existing alias.

```bash
envault alias remove db
```

Throws an error if the alias does not exist.

### `list`

Print all defined aliases.

```bash
envault alias list
# db -> DATABASE_URL
# secret -> JWT_SECRET
```

## Alias Rules

- Aliases must contain only alphanumeric characters, underscores (`_`), or hyphens (`-`).
- Aliases are stored in `.envault/aliases.json` and should be committed to version control so the whole team benefits.
- If a given string does not match any alias, it is used as-is (pass-through).

## Storage

Aliases are persisted in `.envault/aliases.json`:

```json
{
  "db": "DATABASE_URL",
  "secret": "JWT_SECRET"
}
```

## Notes

- Aliases do **not** affect the encrypted vault keys themselves — they are purely a client-side convenience layer.
- Circular aliases are not detected; avoid mapping an alias to another alias.
