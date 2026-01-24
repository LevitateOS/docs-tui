/**
 * TableBlock.ts - Render table blocks with headers and rows
 */

import type { TableBlock as TableBlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToString, inlineToAnsi, color } from "./shared"

export function TableBlock(block: TableBlockType, width: number): StyledLine[] {
	const lines: StyledLine[] = []

	// Calculate column width - divide available width by number of columns
	const numCols = block.headers.length
	const colWidth = Math.floor((width - (numCols - 1) * 3) / numCols)

	// Render header row (use plain text for padding calculation)
	const headerParts = block.headers.map((h, i) => {
		const plain = inlineToString(h)
		const formatted = inlineToAnsi(h)
		// Pad based on plain text length, but use formatted text
		const padding = Math.max(0, colWidth - plain.length)
		const result = formatted + " ".repeat(padding)
		// Apply monospace styling if this column is marked
		if (block.monospaceCol === i) {
			return color.cyan + plain.padEnd(colWidth).slice(0, colWidth) + color.reset
		}
		return plain.padEnd(colWidth).slice(0, colWidth)
	})
	lines.push({ text: headerParts.join(" │ "), bold: true, dim: true })

	// Separator line
	const separatorWidth = colWidth * numCols + (numCols - 1) * 3
	lines.push({ text: "─".repeat(Math.min(separatorWidth, width)), dim: true })

	// Render data rows
	for (const row of block.rows) {
		const rowParts = row.map((cell, i) => {
			const plain = inlineToString(cell)
			const formatted = inlineToAnsi(cell)
			// For cells with formatting, we need to handle padding carefully
			const truncated = plain.slice(0, colWidth)
			const padding = Math.max(0, colWidth - truncated.length)
			// Apply monospace styling if this column is marked
			if (block.monospaceCol === i) {
				return color.cyan + truncated + color.reset + " ".repeat(padding)
			}
			// If cell has rich text formatting, use formatted version
			if (typeof cell !== "string") {
				return formatted + " ".repeat(padding)
			}
			return truncated + " ".repeat(padding)
		})
		lines.push({ text: rowParts.join(" │ ") })
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
