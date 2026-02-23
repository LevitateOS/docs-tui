import {
	SegmentedStatusLine,
	hotkeyStatusSegment,
	scopeStatusSegment,
	textStatusSegment,
	type StatusSegment,
} from "@levitate/tui-kit";
import type { ReactNode } from "react";

type SidebarMode = "focus-section" | "all-sections";

export function installStatusBar(
	currentIndex: number,
	pageCount: number,
	sidebarMode: SidebarMode,
	startLine: number,
	endLine: number,
	totalLines: number,
	note?: string,
): ReactNode {
	const safePageCount = Math.max(1, pageCount);
	const safeCurrentPage = Math.max(1, Math.min(safePageCount, currentIndex + 1));
	const safeTotalLines = Math.max(1, totalLines);
	const safeStartLine = Math.max(1, Math.min(startLine, safeTotalLines));
	const safeEndLine = Math.max(safeStartLine, Math.min(endLine, safeTotalLines));
	const modeLabel = sidebarMode === "focus-section" ? "focus-nav" : "all-nav";

	const segments: StatusSegment[] = [
		scopeStatusSegment("docs"),
		hotkeyStatusSegment("quit", "q", "quit"),
		hotkeyStatusSegment("nav", "h/l", "page"),
		hotkeyStatusSegment("line", "↑/↓ j/k", "line"),
		hotkeyStatusSegment("section", "[/]", "section"),
		hotkeyStatusSegment("mode", "tab", modeLabel),
		hotkeyStatusSegment("jump", "g/G", "top/end"),
		textStatusSegment("lines", `lines ${safeStartLine}-${safeEndLine}/${safeTotalLines}`),
		textStatusSegment("page", `page ${safeCurrentPage}/${safePageCount}`),
	];

	if (typeof note === "string" && note.trim().length > 0) {
		segments.push(textStatusSegment("note", note.trim(), "warning"));
	}

	return <SegmentedStatusLine segments={segments} />;
}
