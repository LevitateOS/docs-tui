import {
	normalizeTextWidth,
	padRight,
	parseSyntaxTokenLine,
	truncateLine,
} from "@levitate/tui-kit";
import type {
	AstBlockNode,
	AstDocumentNode,
	AstInlineNode,
	StyledRow,
	StyledRowKind,
	StyledRun,
} from "../../domain/render-ast/types";
import { inlineNodesToPlain } from "./ast-build";

type RunStyle = Omit<StyledRun, "text">;

function sameStyle(left: RunStyle, right: RunStyle): boolean {
	return (
		left.intent === right.intent &&
		left.backgroundIntent === right.backgroundIntent &&
		left.literalColor === right.literalColor &&
		left.bold === right.bold &&
		left.italic === right.italic &&
		left.underline === right.underline
	);
}

function inlineNodesToRuns(
	nodes: ReadonlyArray<AstInlineNode>,
	defaultIntent: StyledRun["intent"] = "text",
): StyledRun[] {
	const runs: StyledRun[] = [];

	for (const node of nodes) {
		if (node.text.length === 0) {
			continue;
		}
		if (node.type === "text") {
			runs.push({ text: node.text, intent: defaultIntent });
			continue;
		}
		if (node.type === "strong") {
			runs.push({ text: node.text, intent: defaultIntent, bold: true });
			continue;
		}
		if (node.type === "emphasis") {
			runs.push({ text: node.text, intent: defaultIntent, italic: true });
			continue;
		}
		if (node.type === "code") {
			runs.push({ text: node.text, intent: "accent", bold: true });
			continue;
		}
		if (node.type === "link") {
			runs.push({ text: node.text, intent: "info", underline: true });
			if (node.href.trim().length > 0 && node.href !== node.text) {
				runs.push({ text: ` (${node.href})`, intent: "dimText" });
			}
			continue;
		}
	}

	return runs.length > 0 ? runs : [{ text: "", intent: defaultIntent }];
}

function pushTextRun(target: StyledRun[], text: string, style: RunStyle): void {
	if (text.length === 0) {
		return;
	}
	const previous = target[target.length - 1];
	if (previous && sameStyle(previous, style)) {
		previous.text += text;
		return;
	}
	target.push({
		text,
		...style,
	});
}

function wrapStyledRuns(
	runs: ReadonlyArray<StyledRun>,
	width: number,
	kind: StyledRowKind,
): StyledRow[] {
	const safeWidth = Math.max(1, normalizeTextWidth(width, 1));
	const rows: StyledRow[] = [];
	let current: StyledRun[] = [];
	let currentWidth = 0;

	const flush = () => {
		rows.push({
			kind,
			runs: current.length > 0 ? current : [{ text: "" }],
		});
		current = [];
		currentWidth = 0;
	};

	for (const run of runs) {
		const style: RunStyle = {
			intent: run.intent,
			backgroundIntent: run.backgroundIntent,
			literalColor: run.literalColor,
			bold: run.bold,
			italic: run.italic,
			underline: run.underline,
		};
		for (const char of run.text) {
			if (char === "\n") {
				flush();
				continue;
			}
			if (currentWidth >= safeWidth) {
				flush();
			}
			pushTextRun(current, char, style);
			currentWidth += 1;
		}
	}

	if (current.length > 0 || rows.length === 0) {
		flush();
	}

	return rows;
}

function decorateRows(rows: StyledRow[], style: RunStyle): StyledRow[] {
	return rows.map((row) => ({
		...row,
		runs: row.runs.map((run) => ({
			...run,
			intent: run.intent ?? style.intent,
			backgroundIntent: run.backgroundIntent ?? style.backgroundIntent,
			literalColor: run.literalColor ?? style.literalColor,
			bold: run.bold ?? style.bold,
			italic: run.italic ?? style.italic,
			underline: run.underline ?? style.underline,
		})),
	}));
}

function rowFromText(text: string, kind: StyledRowKind, style: RunStyle): StyledRow {
	return {
		kind,
		runs: [{ text, ...style }],
	};
}

function spacerRow(): StyledRow {
	return {
		kind: "spacer",
		runs: [{ text: "" }],
	};
}

function indentRows(rows: StyledRow[], indent: number): StyledRow[] {
	if (indent <= 0) {
		return rows;
	}
	const prefix = " ".repeat(indent);
	return rows.map((row) => ({
		...row,
		runs: [{ text: prefix }, ...row.runs],
	}));
}

function wrapInlineNodesWithPrefix(
	nodes: ReadonlyArray<AstInlineNode>,
	width: number,
	kind: StyledRowKind,
	prefix: string,
	defaultIntent: StyledRun["intent"] = "text",
	style?: RunStyle,
): StyledRow[] {
	const safePrefix = prefix.trim().length > 0 ? `${prefix} ` : "";
	const continuationPrefix = " ".repeat(safePrefix.length);
	const contentWidth = Math.max(1, normalizeTextWidth(width, 1) - safePrefix.length);
	const wrapped = wrapStyledRuns(inlineNodesToRuns(nodes, defaultIntent), contentWidth, kind);
	const prefixed = wrapped.map((row, index) => ({
		...row,
		runs: [
			{
				text: index === 0 ? safePrefix : continuationPrefix,
				intent: defaultIntent,
			},
			...row.runs,
		],
	}));

	return style ? decorateRows(prefixed, style) : prefixed;
}

function wrapSingleStyledLine(
	text: string,
	width: number,
	kind: StyledRowKind,
	style: RunStyle,
): StyledRow[] {
	return decorateRows(
		wrapStyledRuns(
			[
				{
					text,
					intent: style.intent ?? "text",
					bold: style.bold,
					italic: style.italic,
					underline: style.underline,
					backgroundIntent: style.backgroundIntent,
					literalColor: style.literalColor,
				},
			],
			width,
			kind,
		),
		style,
	);
}

function syntaxStyledRuns(
	line: string,
	fallbackIntent: StyledRun["intent"],
	baseStyle: RunStyle,
): StyledRun[] {
	const tokens = parseSyntaxTokenLine(line);
	return tokens.map((token) => ({
		text: token.text,
		intent: token.color ? undefined : fallbackIntent,
		literalColor: token.color,
		backgroundIntent: baseStyle.backgroundIntent,
		bold: baseStyle.bold,
		italic: baseStyle.italic,
		underline: baseStyle.underline,
	}));
}

function wrapSyntaxStyledLine(
	line: string,
	width: number,
	kind: StyledRowKind,
	style: RunStyle,
	fallbackIntent: StyledRun["intent"] = "text",
): StyledRow[] {
	return wrapStyledRuns(syntaxStyledRuns(line, fallbackIntent, style), width, kind);
}

function layoutTableRows(
	block: Extract<AstBlockNode, { type: "table" }>,
	width: number,
): StyledRow[] {
	const headerCells = block.headers.map((header) => inlineNodesToPlain(header));
	const bodyRows = block.rows.map((row) => row.map((cell) => inlineNodesToPlain(cell)));
	const matrix = [headerCells, ...bodyRows];
	const columnCount = matrix.reduce((max, row) => Math.max(max, row.length), 0);
	if (columnCount === 0) {
		return [];
	}

	const widths = Array.from({ length: columnCount }, (_, index) => {
		let max = 1;
		for (const row of matrix) {
			max = Math.max(max, String(row[index] ?? "").length);
		}
		return Math.min(32, max);
	});

	const renderRow = (row: ReadonlyArray<string>): string =>
		widths
			.map((columnWidth, index) =>
				padRight(truncateLine(String(row[index] ?? ""), columnWidth), columnWidth),
			)
			.join("  ");

	const safeWidth = Math.max(1, normalizeTextWidth(width, 1));
	const rows: StyledRow[] = [];
	rows.push(
		...wrapSingleStyledLine(renderRow(headerCells), safeWidth, "table", {
			intent: "sectionSubheading",
			bold: true,
			backgroundIntent: "cardBackground",
		}),
	);
	for (const row of bodyRows) {
		rows.push(
			...wrapSingleStyledLine(renderRow(row), safeWidth, "table", {
				intent: "text",
				backgroundIntent: "cardBackground",
			}),
		);
	}
	return rows;
}

function layoutBlock(block: AstBlockNode, width: number, indent = 0): StyledRow[] {
	const safeWidth = Math.max(1, width - indent);
	let rows: StyledRow[] = [];

	switch (block.type) {
		case "paragraph":
			rows = wrapStyledRuns(inlineNodesToRuns(block.content, "text"), safeWidth, "paragraph");
			break;
		case "code": {
			const labelParts = [block.language.toUpperCase()];
			if (typeof block.filename === "string" && block.filename.length > 0) {
				labelParts.push(block.filename);
			}
			rows.push(
				...wrapSingleStyledLine(labelParts.join(" • "), safeWidth, "meta", {
					intent: "sectionSubheading",
					bold: true,
					backgroundIntent: "cardBackground",
				}),
			);
			if (block.lines.length === 0) {
				rows.push(
					...wrapSingleStyledLine("(empty code block)", safeWidth, "code", {
						intent: "dimText",
						backgroundIntent: "cardBackground",
					}),
				);
			} else {
				for (const line of block.lines) {
					rows.push(
						...wrapSyntaxStyledLine(
							line,
							safeWidth,
							"code",
							{
								intent: "text",
								backgroundIntent: "cardBackground",
							},
							"text",
						),
					);
				}
			}
			break;
		}
		case "table":
			rows = layoutTableRows(block, safeWidth);
			break;
		case "list":
			for (const [index, item] of block.items.entries()) {
				const marker = block.ordered ? `${index + 1}.` : "•";
				rows.push(
					...wrapInlineNodesWithPrefix(item.content, safeWidth, "paragraph", marker, "text"),
				);
				for (const child of item.children) {
					rows.push(
						...wrapInlineNodesWithPrefix(child, safeWidth, "paragraph", "  •", "dimText", {
							intent: "dimText",
						}),
					);
				}
			}
			break;
		case "command":
			rows.push(
				...decorateRows(
					wrapStyledRuns(inlineNodesToRuns(block.description, "text"), safeWidth, "paragraph"),
					{
						backgroundIntent: "cardBackground",
					},
				),
			);
			for (const [index, line] of block.commandLines.entries()) {
				const prefix = index === 0 ? "$ " : "  ";
				rows.push(
					...wrapSyntaxStyledLine(
						`${prefix}${line}`,
						safeWidth,
						"command",
						{
							intent: "commandPrompt",
							bold: true,
							backgroundIntent: "commandBarBackground",
						},
						"commandPrompt",
					),
				);
			}
			for (const line of block.outputLines) {
				rows.push(
					...wrapSingleStyledLine(line, safeWidth, "command", {
						intent: "dimText",
						backgroundIntent: "cardBackground",
					}),
				);
			}
			break;
		case "note": {
			const intent =
				block.variant === "danger" ? "error" : block.variant === "warning" ? "warning" : "info";
			const backgroundIntent = block.variant === "info" ? "cardBackground" : "warningBackground";
			rows.push(
				rowFromText(`[${block.variant.toUpperCase()}]`, "note", {
					intent,
					bold: true,
					backgroundIntent,
				}),
			);
			rows.push(
				...decorateRows(
					wrapStyledRuns(inlineNodesToRuns(block.content, "text"), safeWidth, "note"),
					{
						backgroundIntent,
					},
				),
			);
			break;
		}
		case "qa":
			for (const [index, item] of block.items.entries()) {
				rows.push(
					...wrapInlineNodesWithPrefix(item.question, safeWidth, "qa", "Q:", "sectionHeading", {
						intent: "sectionHeading",
						bold: true,
					}),
				);
				rows.push(rowFromText("A:", "qa", { intent: "sectionSubheading", bold: true }));
				if (item.answer.length === 0) {
					rows.push(rowFromText("(no answer provided)", "qa", { intent: "dimText" }));
				} else {
					for (const answerBlock of item.answer) {
						rows.push(...layoutBlock(answerBlock, safeWidth, 2));
					}
				}
				if (index < block.items.length - 1) {
					rows.push(spacerRow());
				}
			}
			break;
		case "conversation":
			for (const message of block.messages) {
				const roleLabel = message.role === "ai" ? "AI" : "User";
				const intent = message.role === "ai" ? "info" : "sectionSubheading";
				rows.push(
					...decorateRows(
						wrapInlineNodesWithPrefix(
							message.text,
							safeWidth,
							"conversation",
							`${roleLabel}:`,
							intent,
						),
						{
							backgroundIntent: "cardBackground",
						},
					),
				);
				for (const listItem of message.list) {
					rows.push(
						...decorateRows(
							wrapInlineNodesWithPrefix(listItem, safeWidth, "conversation", "  •", "text"),
							{
								backgroundIntent: "cardBackground",
							},
						),
					);
				}
			}
			break;
		case "interactive":
			if (block.intro && block.intro.length > 0) {
				rows.push(
					...decorateRows(
						wrapStyledRuns(inlineNodesToRuns(block.intro, "text"), safeWidth, "interactive"),
						{
							backgroundIntent: "cardBackground",
						},
					),
				);
			}
			for (const step of block.steps) {
				rows.push(
					...wrapSingleStyledLine(`$ ${step.command}`, safeWidth, "interactive", {
						intent: "commandPrompt",
						bold: true,
						backgroundIntent: "commandBarBackground",
					}),
				);
				rows.push(
					...decorateRows(
						wrapStyledRuns(inlineNodesToRuns(step.description, "text"), safeWidth, "interactive"),
						{
							backgroundIntent: "cardBackground",
						},
					),
				);
			}
			break;
		default:
			rows = [];
	}

	return indentRows(rows, indent);
}

function trimTrailingSpacers(rows: StyledRow[]): StyledRow[] {
	const copy = rows.slice();
	while (copy.length > 0 && copy[copy.length - 1]?.kind === "spacer") {
		copy.pop();
	}
	return copy;
}

export function layoutDocumentRows(document: AstDocumentNode, width: number): StyledRow[] {
	const safeWidth = normalizeTextWidth(width, 20);
	const rows: StyledRow[] = [];

	if (document.intro && document.intro.length > 0) {
		rows.push(...wrapStyledRuns(inlineNodesToRuns(document.intro, "text"), safeWidth, "paragraph"));
		rows.push(spacerRow());
	}

	for (const [sectionIndex, section] of document.sections.entries()) {
		if (sectionIndex > 0 && rows.length > 0) {
			rows.push(spacerRow());
		}
		rows.push({
			kind: "heading",
			runs: inlineNodesToRuns(section.title, "sectionHeading").map((run) => ({
				...run,
				bold: true,
			})),
		});
		rows.push(spacerRow());

		for (const [blockIndex, block] of section.blocks.entries()) {
			rows.push(...layoutBlock(block, safeWidth, 0));
			if (blockIndex < section.blocks.length - 1) {
				rows.push(spacerRow());
			}
		}
	}

	return trimTrailingSpacers(rows);
}
