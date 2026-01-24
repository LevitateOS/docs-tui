/**
 * ConversationBlock.ts - Render conversation blocks (user/AI chat)
 */

import type { ConversationBlock as ConversationBlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToAnsi, color } from "./shared"

export function ConversationBlock(block: ConversationBlockType, _width: number): StyledLine[] {
	const lines: StyledLine[] = []

	for (const msg of block.messages) {
		const role = msg.role === "user" ? "You:" : "AI:"
		const roleColor = msg.role === "user" ? color.blue : color.green

		lines.push({
			text: `${role} ${inlineToAnsi(msg.text)}`,
			color: roleColor,
		})

		// Optional list items in message
		if (msg.list) {
			for (const item of msg.list) {
				lines.push({
					text: `    • ${inlineToAnsi(item)}`,
					dim: true,
				})
			}
		}
	}

	lines.push({ text: "" }) // Empty line after block

	return lines
}
