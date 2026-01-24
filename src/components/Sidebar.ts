/**
 * Sidebar.ts - Navigation sidebar component
 *
 * Renders the docs navigation in the left pane.
 */

import { docsNav } from "@levitate/docs-content"
import { type StyledLine, color } from "../tui/screen"

export type SidebarItem = {
	slug: string
	title: string
}

/**
 * Flatten the nav structure into a simple list of items
 */
export function flattenNav(): SidebarItem[] {
	const items: SidebarItem[] = []
	for (const section of docsNav) {
		for (const item of section.items) {
			items.push({
				slug: item.href.replace("/docs/", ""),
				title: item.title,
			})
		}
	}
	return items
}

/**
 * Render the sidebar navigation
 *
 * @param selectedSlug - Currently selected page slug
 * @param width - Available width for sidebar
 * @param height - Available height for sidebar content
 */
export function Sidebar(
	selectedSlug: string,
	width: number,
	_height: number,
): StyledLine[] {
	const lines: StyledLine[] = []
	const maxLen = width - 2 // Account for padding

	const pad = (s: string) => s.slice(0, maxLen).padEnd(maxLen)

	// Header
	lines.push({ text: pad("LevitateOS Docs"), bold: true, color: color.cyan })
	lines.push({ text: pad("←→ pages ↑↓ scroll"), dim: true })
	lines.push({ text: pad("") })

	// Navigation sections
	for (const section of docsNav) {
		lines.push({ text: pad("") }) // Spacing between sections
		lines.push({ text: pad(section.title.toUpperCase()), bold: true, dim: true })

		for (const item of section.items) {
			const slug = item.href.replace("/docs/", "")
			const isSelected = selectedSlug === slug

			if (isSelected) {
				// Selected item - highlighted
				lines.push({
					text: pad(` ${item.title}`),
					color: color.black + color.bgCyan,
				})
			} else {
				lines.push({ text: pad(` ${item.title}`) })
			}
		}
	}

	return lines
}
