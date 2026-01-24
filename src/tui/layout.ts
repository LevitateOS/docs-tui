/**
 * layout.ts - Two-pane layout calculations
 *
 * Manages the split layout between sidebar and content pane.
 */

import { screen } from "./screen"

export interface Layout {
	/** Total terminal columns */
	cols: number
	/** Total terminal rows */
	rows: number
	/** Sidebar width in columns */
	sidebarWidth: number
	/** Content pane width in columns */
	contentWidth: number
	/** Height available for content (excluding header/footer) */
	contentHeight: number
	/** Starting column for content pane */
	contentStartCol: number
}

/** Fixed sidebar width */
const SIDEBAR_WIDTH = 28

/** Reserved rows for header/footer/borders */
const RESERVED_ROWS = 4

/**
 * Calculate layout dimensions based on current terminal size
 */
export function calculateLayout(): Layout {
	const { cols, rows } = screen.size()

	const sidebarWidth = SIDEBAR_WIDTH
	const contentStartCol = sidebarWidth + 1
	const contentWidth = Math.max(20, cols - sidebarWidth - 2)
	const contentHeight = Math.max(5, rows - RESERVED_ROWS)

	return {
		cols,
		rows,
		sidebarWidth,
		contentWidth,
		contentHeight,
		contentStartCol,
	}
}

/**
 * Draw a vertical line separator
 */
export function drawSeparator(col: number, height: number): void {
	const { moveTo, write } = screen
	for (let row = 0; row < height; row++) {
		moveTo(col, row + 1)
		write("│")
	}
}

/**
 * Draw a horizontal line
 */
export function drawHorizontalLine(row: number, startCol: number, width: number): void {
	screen.moveTo(startCol, row)
	screen.write("─".repeat(width))
}
