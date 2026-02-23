import {
	SegmentedStatusLine,
	hotkeyStatusSegment,
	scopeStatusSegment,
	textStatusSegment,
	type StatusSegment,
} from "@levitate/tui-kit";
import type { ReactNode } from "react";
import type { SidebarMode } from "./sidebar";

export function installStatusBar(
	currentIndex: number,
	pageCount: number,
	currentSectionIndex: number,
	sectionCount: number,
	startLine: number,
	endLine: number,
	totalLines: number,
	sidebarMode: SidebarMode,
	note?: string,
): ReactNode {
	const sectionLabel =
		sectionCount > 0 ? `section ${currentSectionIndex + 1}/${sectionCount}` : "section 0/0";
	const modeLabel = sidebarMode === "focus-section" ? "focus sidebar" : "full sidebar";
	const safePageCount = Math.max(1, pageCount);
	const safeCurrentPage = Math.max(1, Math.min(safePageCount, currentIndex + 1));
	const safeTotalLines = Math.max(1, totalLines);
	const safeStart = Math.max(0, Math.min(safeTotalLines, startLine));
	const safeEnd = Math.max(safeStart, Math.min(safeTotalLines, endLine));

	const segments: StatusSegment[] = [
		scopeStatusSegment("docs"),
		hotkeyStatusSegment("quit", "q", "quit"),
		hotkeyStatusSegment("nav", "←/→", "pages"),
		hotkeyStatusSegment("section", "[/]", "sections"),
		hotkeyStatusSegment("scroll", "j/k", "scroll"),
		hotkeyStatusSegment("mode", "tab", "sidebar"),
		textStatusSegment("page", `page ${safeCurrentPage}/${safePageCount}`),
		textStatusSegment("lines", `lines ${safeStart}-${safeEnd}/${safeTotalLines}`),
		textStatusSegment("section-info", sectionLabel, "info"),
		textStatusSegment("mode-info", modeLabel, "dimText"),
	];

	if (typeof note === "string" && note.trim().length > 0) {
		segments.push(textStatusSegment("note", note.trim(), "warning"));
	}

	return <SegmentedStatusLine segments={segments} />;
}
