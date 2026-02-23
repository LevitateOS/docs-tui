import { clampNumber } from "@levitate/tui-kit";
import type {
	DocsContentLike,
	DocsRenderStyleContext,
	FlatDocsNavItem,
} from "../../domain/content/contracts";
import type { StyledRow } from "../../domain/render-ast/types";
import { buildDocumentAst } from "./ast-build";
import { layoutDocumentRows } from "./ast-layout";

type InitialDocSelection = {
	index: number;
	unknownSlug?: string;
};

export type DocsViewport = {
	bodyRows: StyledRow[];
	totalLines: number;
	visibleRows: number;
	maxScroll: number;
	scrollOffset: number;
	startLine: number;
	endLine: number;
};

export function resolveInitialDocSelection(
	navItems: ReadonlyArray<FlatDocsNavItem>,
	slug?: string,
): InitialDocSelection {
	if (navItems.length === 0) {
		return { index: 0 };
	}

	const normalized = slug?.trim() ?? "";
	if (normalized.length === 0) {
		return { index: 0 };
	}

	const index = navItems.findIndex((item) => item.slug === normalized);
	if (index >= 0) {
		return { index };
	}

	return {
		index: 0,
		unknownSlug: normalized,
	};
}

export function resolveInitialDocIndex(
	navItems: ReadonlyArray<FlatDocsNavItem>,
	slug?: string,
): number {
	return resolveInitialDocSelection(navItems, slug).index;
}

export function computeDocsViewport(
	content: DocsContentLike,
	slug: string,
	requestedScrollOffset: number,
	contentInnerRows: number,
	contentWidth: number,
	styleContext?: DocsRenderStyleContext,
): DocsViewport {
	void styleContext;
	const safeRows = Math.max(1, contentInnerRows);
	const safeWidth = Math.max(20, contentWidth);
	const ast = buildDocumentAst(content, slug);
	const allBodyRows = layoutDocumentRows(ast, safeWidth);

	const visibleRows = safeRows;
	const maxScroll = Math.max(0, allBodyRows.length - visibleRows);
	const scrollOffset = clampNumber(requestedScrollOffset, 0, maxScroll);
	const startLine = allBodyRows.length === 0 ? 0 : scrollOffset + 1;
	const endLine =
		allBodyRows.length === 0 ? 0 : Math.min(allBodyRows.length, scrollOffset + visibleRows);

	return {
		bodyRows: allBodyRows.slice(scrollOffset, scrollOffset + visibleRows),
		totalLines: allBodyRows.length,
		visibleRows,
		maxScroll,
		scrollOffset,
		startLine,
		endLine,
	};
}
