# @levitate/docs-tui

## DEPRECATED

Deprecated as of 2026-02-24.

Canonical TUI development moved to:
- `git@github.com:LevitateOS/tui-workspace.git`
- superproject path: `tui/apps/s02-live-tools/install-docs`

This repository remains available for migration compatibility only.
New feature work should not be added here.

Interactive terminal docs viewer for LevitateOS, built on `@levitate/tui-kit`.

Style change map: `style-map.md`

## Usage

```bash
bun src/main.ts
bun src/main.ts --slug installation
bun run split
```

CLI binary name: `levitate-install-docs`

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
bun run inspect:check
bun run check
```
