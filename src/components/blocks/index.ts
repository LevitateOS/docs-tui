/**
 * Block components index
 *
 * Re-exports all block renderers and provides a unified renderBlock function.
 */

import type { ContentBlock } from "@levitate/docs-content"
import type { StyledLine } from "./shared"

// Re-export all block components
export { TextBlock } from "./TextBlock"
export { CodeBlock } from "./CodeBlock"
export { CommandBlock } from "./CommandBlock"
export { ListBlock } from "./ListBlock"
export { TableBlock } from "./TableBlock"
export { InteractiveBlock } from "./InteractiveBlock"
export { ConversationBlock } from "./ConversationBlock"
export { QABlock } from "./QABlock"

// Re-export shared utilities
export { inlineToString, inlineToAnsi, type StyledLine } from "./shared"

// Import for use in renderBlock
import { TextBlock } from "./TextBlock"
import { CodeBlock } from "./CodeBlock"
import { CommandBlock } from "./CommandBlock"
import { ListBlock } from "./ListBlock"
import { TableBlock } from "./TableBlock"
import { InteractiveBlock } from "./InteractiveBlock"
import { ConversationBlock } from "./ConversationBlock"
import { QABlock } from "./QABlock"

/**
 * Render any content block to styled lines
 */
export function renderBlock(block: ContentBlock, width: number): StyledLine[] {
	switch (block.type) {
		case "text":
			return TextBlock(block, width)
		case "code":
			return CodeBlock(block, width)
		case "command":
			return CommandBlock(block, width)
		case "list":
			return ListBlock(block, width)
		case "table":
			return TableBlock(block, width)
		case "interactive":
			return InteractiveBlock(block, width)
		case "conversation":
			return ConversationBlock(block, width)
		case "qa":
			return QABlock(block, width)
		default:
			// TypeScript exhaustiveness check
			const _exhaustive: never = block
			return [{ text: `Unknown block type: ${(block as any).type}` }]
	}
}
