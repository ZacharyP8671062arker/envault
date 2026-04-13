# `envault lock` / `envault unlock`

Protect your local private key with a passphrase using AES-256-GCM encryption derived via PBKDF2.

## Commands

### `envault lock`

Encrypts your private key file (`.envault/private.key`) with a passphrase and stores the result as `.envault/private.key.locked`. The original unencrypted key is deleted.

```bash
envault lock
# Enter passphrase to lock private key: ••••••••
# Private key locked successfully.
```

### `envault unlock`

Decrypts `.envault/private.key.locked` back to `.envault/private.key` using your passphrase.

```bash
envault unlock
# Enter passphrase to unlock private key: ••••••••
# Private key unlocked successfully.
```

## Security Details

- **Key derivation**: PBKDF2 with SHA-256, 100,000 iterations, 32-byte random salt
- **Encryption**: AES-256-GCM with a 12-byte random IV and 16-byte authentication tag
- Each lock operation produces a unique ciphertext even for the same passphrase
- The authentication tag ensures tamper detection; decryption fails if the passphrase is wrong or the file is corrupted

## Workflow

1. Run `envault init` to generate your key pair
2. Run `envault lock` before committing or sharing your machine
3. Run `envault unlock` when you need to use `envault pull` or `envault push`

## Notes

- You cannot lock an already-locked key (`.key.locked` already exists)
- You cannot unlock if no `.key.locked` file is present
- An empty passphrase is rejected
