import {
	SegmentedStatusLine,
	hotkeyStatusSegment,
	scopeStatusSegment,
	textStatusSegment,
	type StatusSegment,
} from "@levitate/tui-kit";
import type { ReactNode } from "react";

export function installStatusBar(
	currentIndex: number,
	pageCount: number,
	note?: string,
): ReactNode {
	const safePageCount = Math.max(1, pageCount);
	const safeCurrentPage = Math.max(1, Math.min(safePageCount, currentIndex + 1));

	const segments: StatusSegment[] = [
		scopeStatusSegment("docs"),
		hotkeyStatusSegment("quit", "q", "quit"),
		hotkeyStatusSegment("nav", "←/→↑/↓ h/j/k/l", "nav"),
		hotkeyStatusSegment("page-scroll", "PgUp/PgDn b/space", "page"),
		hotkeyStatusSegment("jump", "g/G", "top/end"),
		textStatusSegment("page", `page ${safeCurrentPage}/${safePageCount}`),
	];

	if (typeof note === "string" && note.trim().length > 0) {
		segments.push(textStatusSegment("note", note.trim(), "warning"));
	}

	return <SegmentedStatusLine segments={segments} />;
}
