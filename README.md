# envault

> A CLI tool for encrypting and syncing `.env` files across team members using asymmetric keys.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

### Initialize a vault in your project

```bash
envault init
```

This generates a key pair and creates an `envault.config.json` in your project root.

### Encrypt your `.env` file

```bash
envault encrypt --input .env --output .env.vault
```

### Decrypt on another machine

```bash
envault decrypt --input .env.vault --output .env --key ~/.envault/private.key
```

### Add a team member's public key

```bash
envault add-key --name alice --key ./alice.pub.key
```

Team members can now decrypt the vault using their own private key.

---

## How It Works

`envault` uses asymmetric RSA key pairs to encrypt your environment variables. The encrypted `.env.vault` file is safe to commit to version control. Each authorized team member holds a private key locally that can decrypt the vault.

---

## Config

| Field        | Description                        |
|--------------|------------------------------------|
| `keys`       | List of authorized public keys     |
| `vaultFile`  | Path to the encrypted output file  |

---

## License

[MIT](./LICENSE)