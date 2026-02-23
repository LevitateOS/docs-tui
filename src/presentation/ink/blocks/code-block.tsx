import { Box, Text } from "ink";
import { defaultDocsBlockRendererKey, type CodeBlock } from "@levitate/docs-content";
import { parseSyntaxTokenLine, resolveChromeGlyphSet, truncateLine } from "@levitate/tui-kit";
import type { ReactNode } from "react";
import type { BlockComponentProps } from "./types";
import type { BlockPlugin } from "./contracts";
import { codeSnapshotLines } from "./shared/content-utils";
import { useIntentColor } from "./shared/intent-color";

type SyntaxToken = {
	text: string;
	color?: string;
};

const CODE_LINE_NUMBER_PADDING = 1;
const CODE_CONTENT_SAFETY_MARGIN = 1;

function pushToken(row: SyntaxToken[], text: string, color?: string): void {
	if (text.length === 0) {
		return;
	}
	const previous = row[row.length - 1];
	if (previous && previous.color === color) {
		previous.text += text;
		return;
	}
	row.push({ text, color });
}

function wrapSyntaxRows(line: string, width: number): SyntaxToken[][] {
	const safeWidth = Math.max(1, width);
	const tokens = parseSyntaxTokenLine(line);
	if (tokens.length === 0) {
		return [[{ text: "" }]];
	}

	const rows: SyntaxToken[][] = [];
	let current: SyntaxToken[] = [];
	let currentWidth = 0;
	const flush = () => {
		rows.push(current.length > 0 ? current : [{ text: "" }]);
		current = [];
		currentWidth = 0;
	};

	for (const token of tokens) {
		for (const char of token.text) {
			if (currentWidth >= safeWidth) {
				flush();
			}
			pushToken(current, char, token.color);
			currentWidth += 1;
		}
	}

	flush();
	return rows;
}

function tokensWidth(tokens: ReadonlyArray<SyntaxToken>): number {
	return tokens.reduce((total, token) => total + token.text.length, 0);
}

function padTokens(tokens: ReadonlyArray<SyntaxToken>, width: number): SyntaxToken[] {
	const safeWidth = Math.max(1, width);
	const padded = tokens.map((token) => ({ ...token }));
	const missing = safeWidth - tokensWidth(padded);
	if (missing > 0) {
		padded.push({ text: " ".repeat(missing) });
	}
	return padded;
}

function lineNumberText(sourceLine: number, digits: number): string {
	return String(sourceLine).padStart(digits, " ");
}

export function CodeBlockView({
	block,
	contentWidth,
	indent = 0,
}: BlockComponentProps<CodeBlock>): ReactNode {
	const safeWidth = Math.max(1, contentWidth);
	const innerWidth = Math.max(1, safeWidth - 2);
	const sourceLines = codeSnapshotLines(block);
	const lineDigits = Math.max(2, String(Math.max(1, sourceLines.length)).length);
	const lineNumberGutter = lineDigits + CODE_LINE_NUMBER_PADDING + 1;
	const codeInnerWidth = Math.max(1, innerWidth - lineNumberGutter - CODE_CONTENT_SAFETY_MARGIN);
	const borderColor = useIntentColor("cardBorder");
	const headingColor = useIntentColor("accent");
	const dimTextColor = useIntentColor("dimText");
	const textColor = useIntentColor("text");
	const chrome = resolveChromeGlyphSet("single");
	const labelParts = [block.language.toUpperCase()];
	if (typeof block.filename === "string" && block.filename.length > 0) {
		labelParts.push(block.filename);
	}
	const label = labelParts.join(" • ");
	const labelText = truncateLine(label, Math.max(1, innerWidth - 2));
	const topCenter = ` ${labelText} `;
	const topFill = Math.max(0, innerWidth - topCenter.length);
	const bottomLine = `${chrome.bl}${chrome.h.repeat(innerWidth)}${chrome.br}`;

	return (
		<Box flexDirection="column" paddingLeft={indent} width={safeWidth}>
			<Text color={borderColor}>
				<Text color={borderColor}>{chrome.tl}</Text>
				<Text color={headingColor} bold>
					{topCenter}
				</Text>
				<Text color={borderColor}>{chrome.h.repeat(topFill)}</Text>
				<Text color={borderColor}>{chrome.tr}</Text>
			</Text>
			{sourceLines.length === 0 ? (
				<Box flexDirection="row" width={safeWidth}>
					<Text color={borderColor}>{chrome.v}</Text>
					<Text color={dimTextColor}>{truncateLine("(empty code block)", innerWidth)}</Text>
					<Text color={borderColor}>{chrome.v}</Text>
				</Box>
			) : (
				sourceLines.map((line, lineIndex) => {
					const wrapped = wrapSyntaxRows(line, codeInnerWidth).map((row) =>
						padTokens(row, codeInnerWidth),
					);
					return wrapped.map((row, wrappedIndex) => (
						<Box key={`code-${lineIndex}-${wrappedIndex}`} flexDirection="row" width={safeWidth}>
							<Text color={borderColor}>{chrome.v}</Text>
							<Text color={dimTextColor}>
								{wrappedIndex === 0
									? `${lineNumberText(lineIndex + 1, lineDigits)}${" ".repeat(CODE_LINE_NUMBER_PADDING)}${chrome.v}`
									: `${" ".repeat(lineDigits + CODE_LINE_NUMBER_PADDING)}${chrome.v}`}
							</Text>
							<Text color={textColor}>
								{row.map((token, tokenIndex) => (
									<Text
										key={`token-${lineIndex}-${wrappedIndex}-${tokenIndex}`}
										color={token.color ?? textColor}
									>
										{token.text.length > 0 ? token.text : " "}
									</Text>
								))}
							</Text>
							<Text color={borderColor}>{chrome.v}</Text>
						</Box>
					));
				})
			)}
			<Text color={borderColor}>{bottomLine}</Text>
		</Box>
	);
}

export const codeBlockPlugin: BlockPlugin<"code"> = {
	type: "code",
	rendererKey: defaultDocsBlockRendererKey("code"),
	render: (block, context, indent) => (
		<CodeBlockView block={block} contentWidth={context.contentWidth} indent={indent} />
	),
	measure: (block, context, indent) => {
		const safeWidth = Math.max(1, context.contentWidth - indent);
		const innerWidth = Math.max(1, safeWidth - 2);
		const lines = codeSnapshotLines(block);
		if (lines.length === 0) {
			return 3;
		}
		const lineDigits = Math.max(2, String(Math.max(1, lines.length)).length);
		const lineNumberGutter = lineDigits + CODE_LINE_NUMBER_PADDING + 1;
		const codeInnerWidth = Math.max(1, innerWidth - lineNumberGutter - CODE_CONTENT_SAFETY_MARGIN);
		const wrappedRows = lines.reduce(
			(total, line) => total + wrapSyntaxRows(line, codeInnerWidth).length,
			0,
		);
		return 2 + wrappedRows;
	},
};
