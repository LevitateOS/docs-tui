#!/usr/bin/env bun
/**
 * LevitateOS Docs TUI
 *
 * A terminal user interface for viewing LevitateOS documentation.
 * Supports both CLI mode (for piping/testing) and interactive TUI mode.
 */

import {
	docsNav,
	contentBySlug,
	type DocsContent,
	type ContentBlock,
	type RichText,
	type InlineNode,
	type Section,
} from "@levitate/docs-content"
import { startTUI } from "./tui/render"

// ============================================================================
// CLI Mode - for testing without interactive TUI
// ============================================================================

function inlineToString(content: string | RichText): string {
	if (typeof content === "string") return content
	return content.map((node: InlineNode) => {
		if (typeof node === "string") return node
		return node.text
	}).join("")
}

function printBlock(block: ContentBlock, indent = ""): void {
	switch (block.type) {
		case "text":
			console.log(`${indent}${inlineToString(block.content)}`)
			break
		case "code":
			if (block.filename) console.log(`${indent}┌─ ${block.filename}`)
			console.log(`${indent}╭${"─".repeat(60)}╮`)
			for (const line of block.content.split("\n")) {
				console.log(`${indent}│ \x1b[32m${line}\x1b[0m`)
			}
			console.log(`${indent}╰${"─".repeat(60)}╯`)
			break
		case "command":
			console.log(`${indent}\x1b[2m${block.description}\x1b[0m`)
			console.log(`${indent}╭${"─".repeat(60)}╮`)
			const cmd = Array.isArray(block.command) ? block.command.join("\n") : block.command
			for (const line of cmd.split("\n")) {
				console.log(`${indent}│ \x1b[36m$ ${line}\x1b[0m`)
			}
			console.log(`${indent}╰${"─".repeat(60)}╯`)
			if (block.output) console.log(`${indent}\x1b[2m→ ${block.output}\x1b[0m`)
			break
		case "list":
			for (let i = 0; i < block.items.length; i++) {
				const item = block.items[i]
				const prefix = block.ordered ? `${i + 1}.` : "•"
				const text = typeof item === "object" && !Array.isArray(item) && "text" in item
					? inlineToString(item.text)
					: inlineToString(item as string | RichText)
				console.log(`${indent}${prefix} ${text}`)
				if (typeof item === "object" && !Array.isArray(item) && "children" in item && item.children) {
					for (const child of item.children) {
						console.log(`${indent}   ◦ ${inlineToString(child)}`)
					}
				}
			}
			break
		case "table":
			const colW = 20
			const header = block.headers.map(h => inlineToString(h).padEnd(colW).slice(0, colW)).join(" │ ")
			console.log(`${indent}\x1b[1m${header}\x1b[0m`)
			console.log(`${indent}${"─".repeat(colW * block.headers.length + (block.headers.length - 1) * 3)}`)
			for (const row of block.rows) {
				const rowStr = row.map(cell => inlineToString(cell).padEnd(colW).slice(0, colW)).join(" │ ")
				console.log(`${indent}${rowStr}`)
			}
			break
		case "interactive":
			if (block.intro) console.log(`${indent}${inlineToString(block.intro)}`)
			for (const step of block.steps) {
				console.log(`${indent}  \x1b[36m${step.command}\x1b[0m`)
				console.log(`${indent}    \x1b[2m${inlineToString(step.description)}\x1b[0m`)
			}
			break
		case "conversation":
			for (const msg of block.messages) {
				const color = msg.role === "user" ? "\x1b[34m" : "\x1b[32m"
				const role = msg.role === "user" ? "You:" : "AI:"
				console.log(`${indent}${color}${role}\x1b[0m ${inlineToString(msg.text)}`)
				if (msg.list) {
					for (const item of msg.list) {
						console.log(`${indent}    • ${inlineToString(item)}`)
					}
				}
			}
			break
		case "qa":
			for (const item of block.items) {
				console.log(`${indent}\x1b[33;1mQ: ${inlineToString(item.question)}\x1b[0m`)
				console.log(`${indent}A:`)
				for (const ans of item.answer) {
					printBlock(ans, indent + "   ")
				}
			}
			break
	}
	console.log()
}

function printSection(section: Section): void {
	const prefix = section.level === 3 ? "###" : "##"
	console.log(`\x1b[35;1m${prefix} ${section.title}\x1b[0m`)
	console.log()
	for (const block of section.content) {
		printBlock(block)
	}
}

function printPage(slug: string): void {
	const content = contentBySlug[slug]
	if (!content) {
		console.error(`\x1b[31mPage not found: ${slug}\x1b[0m`)
		console.error("Use --list to see available pages")
		process.exit(1)
	}

	console.log(`\x1b[36;1m${"═".repeat(70)}\x1b[0m`)
	console.log(`\x1b[36;1m${content.title}\x1b[0m`)
	console.log(`\x1b[36;1m${"═".repeat(70)}\x1b[0m`)
	console.log()

	if (content.intro) {
		console.log(`\x1b[2m${inlineToString(content.intro)}\x1b[0m`)
		console.log()
	}

	for (const section of content.sections) {
		printSection(section)
	}
}

function listPages(): void {
	console.log("\x1b[36;1mAvailable pages:\x1b[0m\n")
	for (const section of docsNav) {
		console.log(`\x1b[1m${section.title}\x1b[0m`)
		for (const item of section.items) {
			const slug = item.href.replace("/docs/", "")
			console.log(`  ${slug.padEnd(25)} - ${item.title}`)
		}
		console.log()
	}
}

function printAllPages(): void {
	for (const section of docsNav) {
		for (const item of section.items) {
			const slug = item.href.replace("/docs/", "")
			console.log(`\n\x1b[43;30m TESTING: ${slug} \x1b[0m\n`)
			printPage(slug)
			console.log("\n" + "─".repeat(70) + "\n")
		}
	}
}

function showHelp(): void {
	console.log(`
\x1b[36;1mLevitateOS Docs TUI\x1b[0m

Usage:
  bun src/index.ts              Interactive TUI mode
  bun src/index.ts --list       List all available pages
  bun src/index.ts --page SLUG  Print a specific page
  bun src/index.ts --all        Print all pages (for testing)
  bun src/index.ts --help       Show this help

For split-screen with shell:
  bun run split                 Launch with tmux (shell + docs side-by-side)

Examples:
  bun src/index.ts --page getting-started
  bun src/index.ts --page recipe-format
  bun src/index.ts --all 2>&1 | less -R
  bun run split

Navigation (interactive mode):
  ← →        Navigate between pages
  ↑ ↓ j k    Scroll content
  PgUp PgDn  Fast scroll
  g G        Jump to top/bottom
  Space b    Page down/up
  q          Quit

In split-screen mode:
  Ctrl+b ←   Switch to shell pane
  Ctrl+b →   Switch to docs pane
  Ctrl+b x   Close current pane (closes session if only one left)
`)
}

// ============================================================================
// Main
// ============================================================================

const args = process.argv.slice(2)

if (args.includes("--help") || args.includes("-h")) {
	showHelp()
} else if (args.includes("--list") || args.includes("-l")) {
	listPages()
} else if (args.includes("--all") || args.includes("-a")) {
	printAllPages()
} else if (args.includes("--page") || args.includes("-p")) {
	const idx = args.findIndex(a => a === "--page" || a === "-p")
	const slug = args[idx + 1]
	if (!slug) {
		console.error("\x1b[31mError: --page requires a slug argument\x1b[0m")
		process.exit(1)
	}
	printPage(slug)
} else {
	// Interactive mode - start the TUI
	const tmuxMode = args.includes("--tmux-mode")
	startTUI(tmuxMode)
}
