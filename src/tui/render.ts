/**
 * render.ts - Main render loop and application state
 *
 * Coordinates the TUI rendering, input handling, and state management.
 */

import { contentBySlug, type DocsContent } from "@levitate/docs-content"
import { screen, applyStyle, fitToWidth, color, type StyledLine } from "./screen"
import { setupInput, type Key } from "./input"
import { calculateLayout, drawSeparator, drawHorizontalLine, validateTerminalSize, type Layout } from "./layout"
import { Sidebar, flattenNav, type SidebarItem } from "../components/Sidebar"
import { Content, ContentHeader } from "../components/Content"

/**
 * Application state
 */
interface AppState {
	/** Flattened navigation items */
	navItems: SidebarItem[]
	/** Currently selected page index */
	selectedIndex: number
	/** Current scroll offset in content */
	scrollOffset: number
	/** Whether the app should exit */
	shouldExit: boolean
	/** Cached content lines for current page */
	contentLines: StyledLine[]
	/** Current layout */
	layout: Layout
	/** Whether running in tmux split-screen mode */
	tmuxMode: boolean
}

/**
 * Create initial application state
 */
function createInitialState(tmuxMode: boolean): AppState {
	const navItems = flattenNav()
	const layout = calculateLayout()
	const firstContent = navItems[0] ? contentBySlug[navItems[0].slug] : undefined
	const contentLines = Content(firstContent, layout.contentWidth)

	return {
		navItems,
		selectedIndex: 0,
		scrollOffset: 0,
		shouldExit: false,
		contentLines,
		layout,
		tmuxMode,
	}
}

/**
 * Get current page content
 */
function getCurrentContent(state: AppState): DocsContent | undefined {
	const item = state.navItems[state.selectedIndex]
	return item ? contentBySlug[item.slug] : undefined
}

/**
 * Render a styled line at a specific position, fitting to width
 */
function renderLine(
	line: StyledLine,
	row: number,
	col: number,
	width: number,
): void {
	screen.moveTo(col, row)
	const styled = applyStyle(line)
	const fitted = fitToWidth(styled, width)
	screen.write(fitted)
}

/**
 * Render the entire screen
 */
function render(state: AppState): void {
	const { layout } = state
	const content = getCurrentContent(state)
	const currentSlug = state.navItems[state.selectedIndex]?.slug ?? ""

	screen.clear()

	// Render sidebar
	const sidebarLines = Sidebar(currentSlug, layout.sidebarWidth, layout.rows)
	for (let i = 0; i < Math.min(sidebarLines.length, layout.rows - 1); i++) {
		renderLine(sidebarLines[i], i + 1, 1, layout.sidebarWidth)
	}

	// Draw separator
	drawSeparator(layout.sidebarWidth + 1, layout.rows - 1)

	// Render content header
	const header = ContentHeader(
		content,
		state.scrollOffset,
		state.contentLines.length,
		layout.contentHeight,
	)
	renderLine(header, 1, layout.contentStartCol + 1, layout.contentWidth)

	// Draw header separator
	drawHorizontalLine(2, layout.contentStartCol + 1, layout.contentWidth)

	// Render visible content lines
	const startRow = 3
	const visibleCount = layout.contentHeight
	const visible = state.contentLines.slice(
		state.scrollOffset,
		state.scrollOffset + visibleCount,
	)

	for (let i = 0; i < visible.length; i++) {
		renderLine(visible[i], startRow + i, layout.contentStartCol + 1, layout.contentWidth)
	}

	// Render footer with help
	screen.moveTo(1, layout.rows)
	const modeIndicator = state.tmuxMode ? " [Ctrl+b←→: switch panes]" : ""
	screen.write(color.dim + "q: quit  ←→: pages  ↑↓jk: scroll  PgUp/PgDn: fast scroll" + modeIndicator + color.reset)
}

/**
 * Handle key input and update state
 */
function handleKey(state: AppState, key: Key): AppState {
	const maxScroll = Math.max(0, state.contentLines.length - state.layout.contentHeight)

	switch (key.type) {
		case "quit":
			return { ...state, shouldExit: true }

		case "arrow":
			switch (key.dir) {
				case "left":
					if (state.selectedIndex > 0) {
						const newIndex = state.selectedIndex - 1
						const newContent = contentBySlug[state.navItems[newIndex].slug]
						return {
							...state,
							selectedIndex: newIndex,
							scrollOffset: 0,
							contentLines: Content(newContent, state.layout.contentWidth),
						}
					}
					return state

				case "right":
					if (state.selectedIndex < state.navItems.length - 1) {
						const newIndex = state.selectedIndex + 1
						const newContent = contentBySlug[state.navItems[newIndex].slug]
						return {
							...state,
							selectedIndex: newIndex,
							scrollOffset: 0,
							contentLines: Content(newContent, state.layout.contentWidth),
						}
					}
					return state

				case "up":
					return {
						...state,
						scrollOffset: Math.max(0, state.scrollOffset - 1),
					}

				case "down":
					return {
						...state,
						scrollOffset: Math.min(maxScroll, state.scrollOffset + 1),
					}
			}
			break

		case "special":
			switch (key.key) {
				case "pageup":
					return {
						...state,
						scrollOffset: Math.max(0, state.scrollOffset - 10),
					}

				case "pagedown":
					return {
						...state,
						scrollOffset: Math.min(maxScroll, state.scrollOffset + 10),
					}

				case "home":
					return { ...state, scrollOffset: 0 }

				case "end":
					return { ...state, scrollOffset: maxScroll }
			}
			break

		case "char":
			// Other character keys not handled
			break
	}

	return state
}

/**
 * Main entry point for the TUI
 */
export function startTUI(tmuxMode = false): void {
	// Validate terminal size
	if (!validateTerminalSize(tmuxMode)) {
		process.exit(1)
	}

	// Initialize state
	let state = createInitialState(tmuxMode)

	// Enter alternate screen and hide cursor
	// Skip alt screen in tmux mode (tmux handles it)
	if (!state.tmuxMode) {
		screen.enterAltScreen()
	} else {
		screen.clear()
	}
	screen.hideCursor()

	// Initial render
	render(state)

	// Handle terminal resize
	process.stdout.on("resize", () => {
		state = {
			...state,
			layout: calculateLayout(),
			contentLines: Content(getCurrentContent(state), calculateLayout().contentWidth),
		}
		render(state)
	})

	// Setup input handling
	const cleanup = setupInput((key) => {
		state = handleKey(state, key)

		if (state.shouldExit) {
			// Clean up and exit
			screen.showCursor()
			if (!state.tmuxMode) {
				screen.exitAltScreen()
			}
			cleanup()
			process.exit(0)
		}

		render(state)
	})

	// Handle process termination
	process.on("SIGINT", () => {
		screen.showCursor()
		if (!state.tmuxMode) {
			screen.exitAltScreen()
		}
		cleanup()
		process.exit(0)
	})

	process.on("SIGTERM", () => {
		screen.showCursor()
		if (!state.tmuxMode) {
			screen.exitAltScreen()
		}
		cleanup()
		process.exit(0)
	})
}
