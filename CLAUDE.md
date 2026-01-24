# CLAUDE.md - docs-tui

## What is docs-tui?

Terminal UI documentation viewer. Pure TypeScript with ANSI escape codes - no React/Ink dependencies.

## What Belongs Here

- Terminal rendering components (in `src/tui/`)
- Block renderers (in `src/components/blocks/`)
- Navigation logic

## What Does NOT Belong Here

| Don't put here | Put it in |
|----------------|-----------|
| Documentation content | `docs/content/` |
| Website rendering | `website/` (submodule) |

## Architecture

```
src/
├── index.ts           # Entry point (CLI + interactive modes)
├── tui/
│   ├── screen.ts      # ANSI escape sequences, cursor control
│   ├── input.ts       # Raw stdin key parsing
│   ├── render.ts      # Main render loop and state
│   └── layout.ts      # Two-pane layout calculations
└── components/
    ├── Sidebar.ts     # Navigation sidebar
    ├── Content.ts     # Content pane
    └── blocks/        # One file per ContentBlock type
```

## Commands

```bash
bun install
bun src/index.ts         # Run interactive TUI
bun src/index.ts --all   # Test all pages (CLI mode)
bun run typecheck
bun test
```

## Key Rule

Content comes from `@levitate/docs-content`. Do NOT duplicate content here. Both TUI and website must render identically.
