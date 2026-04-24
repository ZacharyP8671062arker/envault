# `envault policy`

Define and enforce key-value rules on your vault entries.

## Overview

The `policy` command lets you define validation rules for environment variable keys. Rules are stored in `.envault/policy.json` and can be enforced during `push`, `pull`, and `lint` operations.

## Usage

```bash
# List all policy rules
envault policy list

# Set a rule for a key or pattern
envault policy set DB_PASSWORD --required --no-empty --min=12

# Set a rule with a regex constraint
envault policy set API_KEY --regex='^[A-Za-z0-9]{32}$'

# Set a rule with a wildcard pattern
envault policy set 'SECRET_*' --required --no-empty

# Remove a rule
envault policy remove DB_PASSWORD
```

## Options

| Flag | Description |
|------|-------------|
| `--required` | The key (or at least one matching key) must be present |
| `--no-empty` | The value must not be empty or whitespace |
| `--min=<n>` | Minimum value length |
| `--max=<n>` | Maximum value length |
| `--regex=<pattern>` | Value must match the given regular expression |

## Wildcard Patterns

Key patterns support `*` as a wildcard. For example, `DB_*` matches `DB_HOST`, `DB_PORT`, `DB_PASSWORD`, etc.

## Policy File

Policies are stored in `.envault/policy.json`:

```json
{
  "version": 1,
  "rules": {
    "DB_*": { "pattern": "DB_*", "required": true, "noEmpty": true },
    "API_KEY": { "pattern": "API_KEY", "minLength": 32, "regex": "^[A-Za-z0-9]+$" }
  }
}
```

Commit `policy.json` to your repository so all team members share the same rules.
