# `envault share` — Share Vault Secrets with a Team Member

## Overview

The `share` command allows a vault owner to securely share encrypted secrets with another team member by re-encrypting the vault contents using the recipient's public key.

## Usage

```bash
envault share <username> <recipient-public-key-path> [options]
```

## Arguments

| Argument | Description |
|---|---|
| `username` | Identifier for the recipient (used as a key in the vault's shared map) |
| `recipient-public-key-path` | Path to the recipient's RSA public key (`.pem`) |

## Options

| Flag | Default | Description |
|---|---|---|
| `--vault` | `.envault/vault.json` | Path to the vault file |
| `--key` | `.envault/private.pem` | Path to your private key for decryption |

## Example

```bash
# Share secrets with teammate Alice
envault share alice ./keys/alice_public.pem

# Share using custom vault and key paths
envault share alice ./keys/alice_public.pem --vault ./my-vault.json --key ./my-private.pem
```

## How It Works

1. Loads the existing vault and decrypts each secret using **your private key**.
2. Re-encrypts each secret using the **recipient's public key**.
3. Stores the re-encrypted secrets under `vault.shared[username]`.

The recipient can then use `envault pull --user <username>` to decrypt and apply the shared secrets.

## Security Notes

- Your private key never leaves your machine.
- The recipient can only decrypt secrets with their own private key.
- Revoking access: use `envault revoke <username>` to remove a user's shared entry.
