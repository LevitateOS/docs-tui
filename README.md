# @levitate/docs-tui

> **STOP. READ. THEN ACT.** Before writing code, read the existing components. Before deleting anything, read it first.

Terminal UI documentation viewer for LevitateOS. Renders the same content as the website in your terminal.

## Installation

```bash
bun install && bun link
```

## Usage

```bash
levitate-docs
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate sections |
| j/k | Scroll content |
| q | Quit |

## Features

- Full content parity with website
- Syntax-highlighted code blocks
- Interactive navigation
- Responsive tables

## Development

```bash
bun install         # Install dependencies
bun src/index.tsx   # Run the TUI
bun run typecheck   # Type checking
```

## Dependencies

- `ink` - React for terminal interfaces
- `@levitate/docs-content` - Shared documentation content

## License

MIT
