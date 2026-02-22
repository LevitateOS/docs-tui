# @levitate/docs-tui

Interactive terminal docs viewer for LevitateOS, built on `@levitate/tui-kit`.

## Usage

```bash
bun src/index.ts
bun src/index.ts --slug getting-started
```

Legacy non-interactive flags (`--list`, `--page`, `--all`) were removed.

## Keybinds

- `q` / `Esc` / `Ctrl-C`: quit
- `h` / `l`: previous/next page
- `j` / `k`: scroll
- `PgUp` / `PgDn`: fast scroll
- `g` / `G`: top/bottom

## Development

```bash
bun install
bun run typecheck
bun run test
```
