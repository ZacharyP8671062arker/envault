# `envault group` — Key Grouping

Organize vault keys into named groups for easier bulk operations and team workflows.

## Usage

```bash
envault group create <groupName>
envault group delete <groupName>
envault group add <groupName> <key>
envault group remove <groupName> <key>
envault group list [groupName]
```

## Subcommands

### `create <groupName>`
Creates a new empty group.

```bash
envault group create production
```

### `delete <groupName>`
Deletes a group and all its key associations. Does not delete the keys themselves from the vault.

```bash
envault group delete production
```

### `add <groupName> <key>`
Adds an existing vault key to a group.

```bash
envault group add production DB_URL
envault group add production API_KEY
```

### `remove <groupName> <key>`
Removes a key from a group without deleting it from the vault.

```bash
envault group remove production API_KEY
```

### `list [groupName]`
Lists all groups, or all keys within a specific group.

```bash
# List all groups
envault group list

# List keys in a group
envault group list production
```

## Storage

Groups are stored in `.envault/groups.json` and should be committed to version control so all team members share the same groupings.

## Notes

- Groups are purely organizational — they do not affect encryption or access control.
- A key can belong to multiple groups.
- Deleting a group does not affect the keys stored in the vault.
