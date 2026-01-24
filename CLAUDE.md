# CLAUDE.md - docs-tui

## What is docs-tui?

Terminal UI documentation viewer. Uses Ink (React for terminal) to render the same content as the website.

## What Belongs Here

- Terminal rendering components
- Ink-based UI
- Navigation logic

## What Does NOT Belong Here

| Don't put here | Put it in |
|----------------|-----------|
| Documentation content | `docs/content/` |
| Website rendering | `website/` (submodule) |

## Commands

```bash
bun install
bun src/index.tsx    # Run the TUI
bun run typecheck
```

## Key Rule

Content comes from `@levitate/docs-content`. Do NOT duplicate content here. Both TUI and website must render identically.
