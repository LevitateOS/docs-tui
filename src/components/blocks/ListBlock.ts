/**
 * ListBlock.ts - Render ordered and unordered lists
 */

import type { ListBlock as ListBlockType, ListItem, RichText } from "@levitate/docs-content"
import { type StyledLine, inlineToAnsi } from "./shared"

export function ListBlock(block: ListBlockType, _width: number): StyledLine[] {
	const lines: StyledLine[] = []

	for (let i = 0; i < block.items.length; i++) {
		const item = block.items[i]
		const prefix = block.ordered ? `${i + 1}.` : "•"

		// Handle different item types
		let text: string
		let children: (string | RichText)[] | undefined

		if (typeof item === "object" && !Array.isArray(item) && "text" in item) {
			// ListItem with text and optional children
			const listItem = item as ListItem
			text = inlineToAnsi(listItem.text)
			children = listItem.children
		} else {
			// Plain string or RichText
			text = inlineToAnsi(item as string | RichText)
		}

		lines.push({ text: `${prefix} ${text}` })

		// Render children if present
		if (children) {
			for (const child of children) {
				lines.push({ text: `   ◦ ${inlineToAnsi(child)}`, dim: true })
			}
		}
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
