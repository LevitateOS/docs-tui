/**
 * NoteBlock.ts - Render note callouts (info/warning/danger)
 */

import type { NoteBlock as NoteBlockType } from "@levitate/docs-content"
import { type StyledLine, inlineToString, wordWrap, color } from "./shared"

export function NoteBlock(block: NoteBlockType, width: number): StyledLine[] {
	const lines: StyledLine[] = []

	const label = block.variant.toUpperCase()
	const labelColor =
		block.variant === "info" ? color.blue : block.variant === "warning" ? color.yellow : color.red
	const prefix = `${label}:`

	const plain = inlineToString(block.content)
	const wrapWidth = Math.max(10, width - (prefix.length + 1))
	const wrapped = wordWrap(plain, wrapWidth)

	for (let i = 0; i < wrapped.length; i++) {
		const pad = i === 0 ? "" : " ".repeat(prefix.length + 1)
		lines.push({
			text: `${pad}${i === 0 ? prefix + " " : ""}${wrapped[i]}`,
			color: labelColor,
			bold: i === 0,
		})
	}

	lines.push({ text: "" })
	return lines
}

