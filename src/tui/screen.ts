/**
 * screen.ts - ANSI escape sequences for terminal control
 *
 * Provides low-level terminal control: cursor movement, colors, screen clearing.
 * No dependencies - pure ANSI escape codes.
 */

const ESC = "\x1b"
const CSI = `${ESC}[`

/**
 * Screen control functions
 */
export const screen = {
	/** Clear entire screen and move cursor to top-left */
	clear: () => process.stdout.write(`${CSI}2J${CSI}H`),

	/** Move cursor to specific position (1-indexed) */
	moveTo: (col: number, row: number) => process.stdout.write(`${CSI}${row};${col}H`),

	/** Hide the cursor */
	hideCursor: () => process.stdout.write(`${CSI}?25l`),

	/** Show the cursor */
	showCursor: () => process.stdout.write(`${CSI}?25h`),

	/** Get terminal size */
	size: () => ({
		cols: process.stdout.columns || 80,
		rows: process.stdout.rows || 24,
	}),

	/** Write text at current cursor position */
	write: (text: string) => process.stdout.write(text),

	/** Enter alternate screen buffer (preserves previous screen) */
	enterAltScreen: () => process.stdout.write(`${CSI}?1049h`),

	/** Exit alternate screen buffer (restores previous screen) */
	exitAltScreen: () => process.stdout.write(`${CSI}?1049l`),

	/** Clear from cursor to end of line */
	clearLine: () => process.stdout.write(`${CSI}K`),

	/** Clear from cursor to end of screen */
	clearToEnd: () => process.stdout.write(`${CSI}J`),
}

/**
 * ANSI color codes
 */
export const color = {
	reset: `${CSI}0m`,
	bold: `${CSI}1m`,
	dim: `${CSI}2m`,
	italic: `${CSI}3m`,
	underline: `${CSI}4m`,

	// Foreground colors
	black: `${CSI}30m`,
	red: `${CSI}31m`,
	green: `${CSI}32m`,
	yellow: `${CSI}33m`,
	blue: `${CSI}34m`,
	magenta: `${CSI}35m`,
	cyan: `${CSI}36m`,
	white: `${CSI}37m`,
	gray: `${CSI}90m`,

	// Background colors
	bgBlack: `${CSI}40m`,
	bgRed: `${CSI}41m`,
	bgGreen: `${CSI}42m`,
	bgYellow: `${CSI}43m`,
	bgBlue: `${CSI}44m`,
	bgMagenta: `${CSI}45m`,
	bgCyan: `${CSI}46m`,
	bgWhite: `${CSI}47m`,
}

/**
 * StyledLine represents a line of text with optional styling
 */
export type StyledLine = {
	text: string
	color?: string   // ANSI color code from color object
	bold?: boolean
	dim?: boolean
}

/**
 * Apply styling to text and return ANSI-formatted string
 */
export function applyStyle(line: StyledLine): string {
	let result = ""

	if (line.bold) result += color.bold
	if (line.dim) result += color.dim
	if (line.color) result += line.color

	result += line.text
	result += color.reset

	return result
}

/**
 * Truncate or pad text to exact width (accounting for ANSI codes)
 */
export function fitToWidth(text: string, width: number): string {
	// Strip ANSI codes for length calculation
	const stripped = text.replace(/\x1b\[[0-9;]*m/g, "")
	if (stripped.length <= width) {
		return text + " ".repeat(width - stripped.length)
	}
	// Need to truncate - find where to cut
	let visibleLen = 0
	let result = ""
	let i = 0
	while (i < text.length && visibleLen < width) {
		if (text[i] === "\x1b" && text[i + 1] === "[") {
			// ANSI sequence - copy until 'm'
			const start = i
			while (i < text.length && text[i] !== "m") i++
			result += text.slice(start, i + 1)
			i++
		} else {
			result += text[i]
			visibleLen++
			i++
		}
	}
	return result + color.reset
}
