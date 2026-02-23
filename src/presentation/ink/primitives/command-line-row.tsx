import type { ColorIntent } from "@levitate/tui-kit";
import type { ReactNode } from "react";
import { useIntentColor } from "../blocks/shared/intent-color";
import { SyntaxLine } from "../blocks/shared/syntax-line";

type CommandLineRowProps = {
	line: string;
	width: number;
	rowIndex?: number;
	prefix?: string;
	fallbackIntent?: ColorIntent;
	primaryBackgroundIntent?: ColorIntent;
	alternateBackgroundIntent?: ColorIntent;
	bold?: boolean;
};

export function CommandLineRow({
	line,
	width,
	rowIndex = 0,
	prefix = "$ ",
	fallbackIntent = "commandPrompt",
	primaryBackgroundIntent = "commandBarBackground",
	alternateBackgroundIntent = "cardBackground",
	bold = true,
}: CommandLineRowProps): ReactNode {
	const primaryBackground = useIntentColor(primaryBackgroundIntent);
	const alternateBackground = useIntentColor(alternateBackgroundIntent);
	const lineBackground = rowIndex % 2 === 0 ? primaryBackground : alternateBackground;
	const fullLine = `${prefix}${line}`;

	return (
		<SyntaxLine
			line={fullLine}
			fallbackIntent={fallbackIntent}
			backgroundIntent={primaryBackgroundIntent}
			backgroundColor={lineBackground}
			width={width}
			bold={bold}
		/>
	);
}
