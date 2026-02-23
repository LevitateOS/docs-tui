import { Box } from "ink";
import type { ReactNode } from "react";
import { CommandLineRow } from "./command-line-row";

type CommandLineSeriesProps = {
	lines: ReadonlyArray<string>;
	width: number;
	firstPrefix?: string;
	continuationPrefix?: string;
	bold?: boolean;
};

export function CommandLineSeries({
	lines,
	width,
	firstPrefix = "$ ",
	continuationPrefix = "  ",
	bold = true,
}: CommandLineSeriesProps): ReactNode {
	return (
		<Box flexDirection="column">
			{lines.map((line, index) => (
				<CommandLineRow
					key={`command-series-${index}`}
					line={line}
					prefix={index === 0 ? firstPrefix : continuationPrefix}
					width={width}
					bold={bold}
				/>
			))}
		</Box>
	);
}
