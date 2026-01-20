# CLAUDE.md - Docs TUI

## What is docs-tui?

Terminal UI documentation viewer for LevitateOS. Uses Ink (React for terminal) to render the same documentation content as the website.

## Architecture

- Uses `@levitate/docs-content` as the single source of truth
- Renders content in terminal with Ink components
- Must maintain parity with website rendering

## Development

```bash
# Install dependencies
bun install

# Run the TUI
bun src/index.tsx

# Type checking
bun run typecheck
```

## Common Mistakes

1. **Diverging from website** - Both must render the same content identically
2. **Breaking content import** - Changes to docs-content may require updates here
3. **Terminal compatibility** - Test in different terminal emulators

## Content Source

All content comes from `@levitate/docs-content`. Do NOT duplicate content here.
