/**
 * input.ts - Raw stdin key parsing
 *
 * Handles raw terminal input, parses ANSI escape sequences for arrow keys,
 * and provides a clean key event interface.
 */

/**
 * Parsed key event types
 */
export type Key =
	| { type: "char"; char: string }
	| { type: "arrow"; dir: "up" | "down" | "left" | "right" }
	| { type: "special"; key: "pageup" | "pagedown" | "home" | "end" }
	| { type: "quit" }

/**
 * Parse raw stdin data into Key events
 */
function parseKey(data: string): Key {
	// Ctrl+C or 'q' = quit
	if (data === "\x03" || data === "q") {
		return { type: "quit" }
	}

	// Escape sequences for special keys
	if (data.startsWith("\x1b[") || data.startsWith("\x1bO")) {
		const seq = data.slice(2)

		// Arrow keys
		if (seq === "A" || seq === "OA") return { type: "arrow", dir: "up" }
		if (seq === "B" || seq === "OB") return { type: "arrow", dir: "down" }
		if (seq === "C" || seq === "OC") return { type: "arrow", dir: "right" }
		if (seq === "D" || seq === "OD") return { type: "arrow", dir: "left" }

		// Page Up/Down
		if (seq === "5~") return { type: "special", key: "pageup" }
		if (seq === "6~") return { type: "special", key: "pagedown" }

		// Home/End
		if (seq === "H" || seq === "1~") return { type: "special", key: "home" }
		if (seq === "F" || seq === "4~") return { type: "special", key: "end" }
	}

	// Handle alternate escape sequences (some terminals)
	if (data === "\x1bOA") return { type: "arrow", dir: "up" }
	if (data === "\x1bOB") return { type: "arrow", dir: "down" }
	if (data === "\x1bOC") return { type: "arrow", dir: "right" }
	if (data === "\x1bOD") return { type: "arrow", dir: "left" }

	// Vim-style navigation
	if (data === "k") return { type: "arrow", dir: "up" }
	if (data === "j") return { type: "arrow", dir: "down" }
	if (data === "h") return { type: "arrow", dir: "left" }
	if (data === "l") return { type: "arrow", dir: "right" }

	// Space for page down, 'b' for page up (vim-like)
	if (data === " ") return { type: "special", key: "pagedown" }
	if (data === "b") return { type: "special", key: "pageup" }

	// 'g' for home, 'G' for end (vim-like)
	if (data === "g") return { type: "special", key: "home" }
	if (data === "G") return { type: "special", key: "end" }

	// Regular character
	return { type: "char", char: data }
}

/**
 * Setup raw input mode and register key handler
 * Returns cleanup function to restore terminal state
 */
export function setupInput(onKey: (key: Key) => void): () => void {
	if (!process.stdin.isTTY) {
		console.error("Not a TTY - interactive mode requires a terminal")
		process.exit(1)
	}

	process.stdin.setRawMode(true)
	process.stdin.resume()
	process.stdin.setEncoding("utf8")

	const handler = (data: string) => {
		const key = parseKey(data)
		onKey(key)
	}

	process.stdin.on("data", handler)

	// Return cleanup function
	return () => {
		process.stdin.off("data", handler)
		process.stdin.setRawMode(false)
		process.stdin.pause()
	}
}
