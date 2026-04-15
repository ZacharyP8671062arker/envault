# `envault verify`

Verifies the integrity of all entries in the vault by attempting to decrypt each one using your private key.

## Usage

```bash
envault verify
```

## Description

The `verify` command reads every encrypted entry in the vault and attempts to decrypt it with your local private key. This is useful for detecting:

- **Corrupted entries** — values that cannot be decrypted (e.g., tampered ciphertext)
- **Missing values** — entries with empty or malformed data
- **Key mismatch** — entries encrypted with a different public key

## Output

Each vault key is listed with one of the following statuses:

| Symbol | Status      | Meaning                                      |
|--------|-------------|----------------------------------------------|
| `✓`    | `ok`        | Entry decrypted successfully                 |
| `✗`    | `corrupted` | Decryption failed; value may be tampered     |
| `✗`    | `missing`   | Entry is empty or has an invalid format      |

### Example

```
Verifying vault integrity...

  ✓ API_KEY
  ✓ DATABASE_URL
  ✗ SECRET_TOKEN [corrupted]: Decryption failed

Some entries failed verification. Your vault may be corrupted.
```

## Options

This command uses the default vault and private key paths:

- Vault: `.envault/vault.json`
- Private key: `.envault/private.pem`

## Notes

- Your private key must be unlocked (not passphrase-protected) to run this command. Use `envault unlock` first if needed.
- This command exits with a non-zero status code if any entries fail verification.
