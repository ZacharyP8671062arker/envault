# `envault unlock`

Decrypts a passphrase-protected private key and restores it to the local `.envault/private.key` file.

## Usage

```bash
envault unlock
```

You will be prompted to enter the passphrase used when the key was locked.

## Prerequisites

- A locked private key must exist at `.envault/private.key.locked`.
- You must know the passphrase used during `envault lock`.

## Behavior

1. Reads the encrypted key from `.envault/private.key.locked`.
2. Prompts for the passphrase.
3. Decrypts the key using AES-256-GCM (via `deriveKeyFromPassphrase`).
4. Writes the plaintext private key to `.envault/private.key` with mode `0600`.

## Notes

- The locked file (`.envault/private.key.locked`) is **not** removed after unlocking, allowing re-locking without re-entering the original passphrase setup.
- The unlocked `private.key` should be added to `.gitignore` to prevent accidental commits.
- If the passphrase is incorrect, the command exits with a non-zero status and prints an error.

## Example

```bash
$ envault unlock
Enter passphrase to unlock private key: ••••••••
Private key unlocked and saved to .envault/private.key
```

## Related Commands

- [`envault lock`](./lock.md) — Encrypt and lock your private key with a passphrase.
