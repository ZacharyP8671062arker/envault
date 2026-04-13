# `envault status`

Displays the current state of the envault vault in the working directory.

## Usage

```bash
envault status
```

## Output

The command prints a summary of the vault's current configuration:

```
envault status
==============
Initialized:    ✔
Public key:     ✔
Private key:    ✔
Vault file:     ✔
Secrets:        5
Shared with:    alice, bob
Audit entries:  12
```

## Fields

| Field | Description |
|---|---|
| `Initialized` | Whether the `.envault` directory exists |
| `Public key` | Whether `public.pem` is present |
| `Private key` | Whether `private.pem` is present (shows `🔒 locked` if passphrase-locked) |
| `Vault file` | Whether `vault.json` exists |
| `Secrets` | Number of encrypted secrets stored in the vault |
| `Shared with` | Usernames whose public keys are in the `shared/` directory |
| `Audit entries` | Number of entries recorded in `audit.log` |

## Notes

- If the private key has been locked with a passphrase via `envault lock`, the status will show `🔒 locked` instead of `✔`.
- Run `envault unlock` to restore access to the private key before performing operations that require decryption.
- This command is read-only and does not modify any vault files.
