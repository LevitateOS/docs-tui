import { Box, Text } from "ink";
import { defaultDocsBlockRendererKey, type CodeBlock } from "@levitate/docs-content";
import type { ReactNode } from "react";
import type { BlockComponentProps } from "./types";
import type { BlockPlugin } from "./contracts";
import { codeSnapshotLines } from "./shared/content-utils";
import { useIntentColor } from "./shared/intent-color";
import { SyntaxLine } from "./shared/syntax-line";

export function CodeBlockView({
	block,
	contentWidth,
	indent = 0,
}: BlockComponentProps<CodeBlock>): ReactNode {
	const safeWidth = Math.max(1, contentWidth);
	const cardBackground = useIntentColor("cardBackground");
	const headingColor = useIntentColor("accent");
	const dimTextColor = useIntentColor("dimText");
	const labelParts = [`CODE ${block.language.toUpperCase()}`];
	if (typeof block.filename === "string" && block.filename.length > 0) {
		labelParts.push(block.filename);
	}

	const snapshotLines = codeSnapshotLines(block);

	return (
		<Box flexDirection="column" paddingLeft={indent} width={safeWidth}>
			<Text color={headingColor} backgroundColor={cardBackground} bold>
				{labelParts.join(" • ")}
			</Text>
			{snapshotLines.length === 0 ? (
				<Text color={dimTextColor} backgroundColor={cardBackground}>
					(empty code block)
				</Text>
			) : (
				snapshotLines.map((line, lineIndex) => (
					<SyntaxLine
						key={`code-${lineIndex}`}
						line={line}
						fallbackIntent="text"
						backgroundIntent="cardBackground"
					/>
				))
			)}
		</Box>
	);
}

export const codeBlockPlugin: BlockPlugin<"code"> = {
	type: "code",
	rendererKey: defaultDocsBlockRendererKey("code"),
	render: (block, context, indent) => (
		<CodeBlockView block={block} contentWidth={context.contentWidth} indent={indent} />
	),
	measure: (block, _context, _indent) => {
		const lines = codeSnapshotLines(block);
		return 1 + (lines.length === 0 ? 1 : lines.length);
	},
};
