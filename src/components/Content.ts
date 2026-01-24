/**
 * Content.ts - Content pane component
 *
 * Renders the documentation content in the right pane.
 */

import type { DocsContent, Section } from "@levitate/docs-content"
import { type StyledLine, color } from "../tui/screen"
import { renderBlock, inlineToAnsi } from "./blocks"

/**
 * Render a section to styled lines
 */
function renderSection(section: Section, width: number): StyledLine[] {
	const lines: StyledLine[] = []

	// Section title
	const prefix = section.level === 3 ? "### " : "## "
	lines.push({
		text: prefix + section.title,
		color: color.magenta,
		bold: true,
	})
	lines.push({ text: "" })

	// Section content blocks
	for (const block of section.content) {
		lines.push(...renderBlock(block, width))
	}

	return lines
}

/**
 * Render page content to styled lines
 *
 * @param content - The page content to render
 * @param width - Available width for content
 */
export function Content(content: DocsContent | undefined, width: number): StyledLine[] {
	if (!content) {
		return [{ text: "No content selected", dim: true }]
	}

	const lines: StyledLine[] = []

	// Intro paragraph if present
	if (content.intro) {
		lines.push({ text: inlineToAnsi(content.intro), dim: true })
		lines.push({ text: "" })
	}

	// All sections
	for (const section of content.sections) {
		lines.push(...renderSection(section, width))
	}

	return lines
}

/**
 * Get the title and scroll indicator for the content header
 */
export function ContentHeader(
	content: DocsContent | undefined,
	scrollOffset: number,
	totalLines: number,
	visibleLines: number,
): StyledLine {
	if (!content) {
		return { text: "No page selected", dim: true }
	}

	// Calculate scroll percentage
	const maxScroll = Math.max(0, totalLines - visibleLines)
	const percent = maxScroll > 0 ? Math.round((scrollOffset / maxScroll) * 100) : 0

	return {
		text: `${content.title} [${percent}%]`,
		color: color.cyan,
		bold: true,
	}
}
