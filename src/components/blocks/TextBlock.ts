/**
 * TextBlock.ts - Render text content blocks
 */

import type { TextBlock as TextBlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToAnsi, inlineToString, wordWrap } from "./shared"

export function TextBlock(block: TextBlockType, width: number): StyledLine[] {
	// Use plain text for word wrapping calculation
	const plainText = inlineToString(block.content)
	const wrapped = wordWrap(plainText, width)

	// If content has no formatting, use wrapped plain text
	if (typeof block.content === "string") {
		const lines: StyledLine[] = wrapped.map(line => ({ text: line }))
		lines.push({ text: "" })
		return lines
	}

	// For rich text, render with ANSI formatting
	// Note: word wrapping with ANSI codes is complex, so we render as single line
	// and rely on terminal's natural wrapping for now
	const formatted = inlineToAnsi(block.content)
	const lines: StyledLine[] = [{ text: formatted }]
	lines.push({ text: "" })

	return lines
}
