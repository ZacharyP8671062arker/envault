# `envault revoke` Command

Revokes a team member's access to the vault.

## Usage

```bash
envault revoke <email>
```

## What it does

1. Looks up the member by email in `.envault/vault.json`.
2. Removes the member entry from the `members` array.
3. Deletes all per-member encrypted secret values associated with that email.
4. Saves the updated vault back to disk.

> **Note:** Revoking a member does **not** rotate the underlying secret values.
> If you need to ensure the member can no longer decrypt secrets (e.g., via a
> cached copy), run `envault rotate` after revoking to re-encrypt all secrets
> for the remaining members.

## Example

```bash
$ envault revoke alice@example.com
Revoked access for "alice@example.com" and removed their encrypted secrets.
```

## Errors

| Error | Cause |
|---|---|
| `No vault found` | `envault init` has not been run |
| `Member not found` | The given email is not in the vault |
| `Vault has no members list` | Vault file is malformed |
