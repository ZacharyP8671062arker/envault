# `envault fmt`

Format a `.env` file for consistency — normalizing whitespace, optionally sorting keys, stripping comments, and trimming values.

## Usage

```bash
envault fmt [file] [options]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `file`   | Path to the `.env` file to format | `.env` |

### Options

| Flag | Description |
|------|-------------|
| `--sort` | Sort keys alphabetically |
| `--strip-comments` | Remove comment lines (lines starting with `#`) |
| `--trim-values` | Trim leading/trailing whitespace from values |

## Examples

**Basic formatting (collapse blank lines, normalize spacing):**
```bash
envault fmt .env
```

**Sort keys and trim values:**
```bash
envault fmt .env --sort --trim-values
```

**Strip comments and sort:**
```bash
envault fmt .env --strip-comments --sort
```

## Behavior

- Collapses 3+ consecutive blank lines into at most 2.
- Trims each key name.
- Preserves quoted values unless `--trim-values` is used.
- If the file is already formatted, prints `Already formatted: <file>` and exits cleanly.
- Writes changes in-place.

## Notes

- This command modifies the file directly. Consider committing or snapshotting before running.
- Use `envault snapshot create` beforehand to save a restore point.
