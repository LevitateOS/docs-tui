/**
 * QABlock.ts - Render Q&A blocks with questions and answers
 */

import type { QABlock as QABlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToAnsi, color } from "./shared"
import { renderBlock } from "./index"

export function QABlock(block: QABlockType, width: number): StyledLine[] {
	const lines: StyledLine[] = []

	for (const item of block.items) {
		// Question
		lines.push({
			text: `Q: ${inlineToAnsi(item.question)}`,
			color: color.yellow,
			bold: true,
		})

		// Answer label
		lines.push({ text: "A:" })

		// Render answer blocks (recursively)
		for (const ansBlock of item.answer) {
			const ansLines = renderBlock(ansBlock, width - 3)
			for (const line of ansLines) {
				lines.push({
					text: "   " + line.text,
					color: line.color,
					dim: line.dim,
					bold: line.bold,
				})
			}
		}
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
