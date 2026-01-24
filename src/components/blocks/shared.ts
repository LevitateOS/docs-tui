/**
 * shared.ts - Shared utilities for block components
 *
 * Common rendering helpers and type re-exports.
 */

import { type StyledLine, color } from "../../tui/screen"
import type { RichText, InlineNode } from "@levitate/docs-content"

// Re-export StyledLine for convenience
export type { StyledLine }
export { color }

/**
 * Convert RichText or string to plain string
 * (TUI doesn't support inline formatting in same way as web)
 */
export function inlineToString(content: string | RichText): string {
	if (typeof content === "string") return content
	return content.map((node: InlineNode) => {
		if (typeof node === "string") return node
		return node.text
	}).join("")
}

/**
 * Convert RichText to styled segments for more advanced rendering
 * Returns array of { text, style } pairs
 */
export type StyledSegment = {
	text: string
	bold?: boolean
	italic?: boolean
	code?: boolean
	link?: string
}

export function inlineToSegments(content: string | RichText): StyledSegment[] {
	if (typeof content === "string") {
		return [{ text: content }]
	}

	return content.map((node: InlineNode): StyledSegment => {
		if (typeof node === "string") {
			return { text: node }
		}
		switch (node.type) {
			case "bold":
				return { text: node.text, bold: true }
			case "italic":
				return { text: node.text, italic: true }
			case "code":
				return { text: node.text, code: true }
			case "link":
				return { text: node.text, link: node.href }
			default:
				return { text: (node as any).text || "" }
		}
	})
}

/**
 * Render styled segments to ANSI string
 */
export function renderSegments(segments: StyledSegment[]): string {
	return segments.map(seg => {
		let result = ""
		if (seg.bold) result += color.bold
		if (seg.italic) result += color.italic
		if (seg.code) result += color.cyan
		if (seg.link) result += color.blue + color.underline
		result += seg.text
		result += color.reset
		return result
	}).join("")
}

/**
 * Convert RichText or string to ANSI-formatted string
 * Renders inline formatting: bold, italic, code, links
 */
export function inlineToAnsi(content: string | RichText): string {
	if (typeof content === "string") return content
	return renderSegments(inlineToSegments(content))
}

/**
 * Word wrap text to fit within width, returns array of lines
 */
export function wordWrap(text: string, width: number): string[] {
	if (width <= 0) return [text]
	const words = text.split(/\s+/)
	const lines: string[] = []
	let currentLine = ""

	for (const word of words) {
		if (currentLine.length === 0) {
			currentLine = word
		} else if (currentLine.length + 1 + word.length <= width) {
			currentLine += " " + word
		} else {
			lines.push(currentLine)
			currentLine = word
		}
	}
	if (currentLine.length > 0) {
		lines.push(currentLine)
	}

	return lines.length > 0 ? lines : [""]
}
