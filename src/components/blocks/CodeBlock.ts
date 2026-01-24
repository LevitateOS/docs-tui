/**
 * CodeBlock.ts - Render code content blocks with box drawing
 */

import type { CodeBlock as CodeBlockType } from "@levitate/docs-content"
import { type StyledLine, color } from "./shared"

export function CodeBlock(block: CodeBlockType, width: number): StyledLine[] {
	const lines: StyledLine[] = []
	const boxWidth = Math.max(width - 2, 10)

	// Optional filename header
	if (block.filename) {
		lines.push({ text: `┌─ ${block.filename}`, dim: true })
	}

	// Box top
	lines.push({ text: "╭" + "─".repeat(boxWidth) + "╮", dim: true })

	// Code lines
	for (const codeLine of block.content.split("\n")) {
		lines.push({
			text: "│ " + codeLine,
			color: color.green,
		})
	}

	// Box bottom
	lines.push({ text: "╰" + "─".repeat(boxWidth) + "╯", dim: true })
	lines.push({ text: "" }) // Empty line after block

	return lines
}
