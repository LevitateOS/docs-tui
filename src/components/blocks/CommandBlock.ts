/**
 * CommandBlock.ts - Render command blocks with description and output
 */

import type { CommandBlock as CommandBlockType } from "@levitate/docs-content"
import { type StyledLine, color } from "./shared"

export function CommandBlock(block: CommandBlockType, width: number): StyledLine[] {
	const lines: StyledLine[] = []
	const boxWidth = Math.max(width - 2, 10)

	// Description
	lines.push({ text: block.description, dim: true })

	// Box top
	lines.push({ text: "╭" + "─".repeat(boxWidth) + "╮", dim: true })

	// Command lines
	const cmdText = Array.isArray(block.command) ? block.command.join("\n") : block.command
	for (const cmdLine of cmdText.split("\n")) {
		lines.push({
			text: "│ $ " + cmdLine,
			color: color.cyan,
		})
	}

	// Box bottom
	lines.push({ text: "╰" + "─".repeat(boxWidth) + "╯", dim: true })

	// Optional output (may be multi-line)
	if (block.output) {
		const outputLines = block.output.split("\n")
		for (let i = 0; i < outputLines.length; i++) {
			const prefix = i === 0 ? "→ " : "  "
			lines.push({ text: prefix + outputLines[i], dim: true })
		}
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
