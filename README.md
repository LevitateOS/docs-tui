# @levitate/docs-tui

Terminal UI documentation viewer for LevitateOS, built with Ink (React for terminal).

## Overview

Renders the same documentation content as the website but in a terminal interface. Uses `@levitate/docs-content` as the content source to maintain parity with the website.

## Usage

```bash
# Run the TUI
bun src/index.tsx

# Or via the binary
bun run dev
```

## Development

```bash
# Install dependencies
bun install

# Type checking
bun run typecheck
```

## Dependencies

- `ink` - React for terminal interfaces
- `@levitate/docs-content` - Shared documentation content

## License

MIT
