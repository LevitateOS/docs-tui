/**
 * InteractiveBlock.ts - Render interactive step-by-step blocks
 *
 * Renders command and description side-by-side to match Astro layout.
 */

import type { InteractiveBlock as InteractiveBlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToAnsi, color } from "./shared"

export function InteractiveBlock(block: InteractiveBlockType, _width: number): StyledLine[] {
	const lines: StyledLine[] = []

	// Optional intro text
	if (block.intro) {
		lines.push({ text: inlineToAnsi(block.intro) })
		lines.push({ text: "" })
	}

	// Find max command length for alignment
	const maxCmdLen = Math.max(...block.steps.map(s => s.command.length))
	const cmdWidth = Math.max(maxCmdLen + 2, 10) // Minimum 10 chars

	// Render each step - command and description on same line
	for (const step of block.steps) {
		const paddedCmd = step.command.padEnd(cmdWidth)
		const desc = inlineToAnsi(step.description)
		// Combine with ANSI: cyan command + reset + dim description
		lines.push({
			text: `  ${color.cyan}${paddedCmd}${color.reset}${color.dim}${desc}${color.reset}`,
		})
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
