import type { ColorIntent } from "@levitate/tui-kit";
import type { ReactNode } from "react";
import { useIntentColor } from "../blocks/shared/intent-color";
import { SyntaxLine } from "../blocks/shared/syntax-line";

type CommandLineRowProps = {
	line: string;
	width: number;
	prefix?: string;
	fallbackIntent?: ColorIntent;
	backgroundIntent?: ColorIntent;
	bold?: boolean;
};

export function CommandLineRow({
	line,
	width,
	prefix = "$ ",
	fallbackIntent = "commandPrompt",
	backgroundIntent = "commandBarBackground",
	bold = true,
}: CommandLineRowProps): ReactNode {
	const lineBackground = useIntentColor(backgroundIntent);
	const fullLine = `${prefix}${line}`;

	return (
		<SyntaxLine
			line={fullLine}
			fallbackIntent={fallbackIntent}
			backgroundIntent={backgroundIntent}
			backgroundColor={lineBackground}
			width={width}
			bold={bold}
		/>
	);
}
