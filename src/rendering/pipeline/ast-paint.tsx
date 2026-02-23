import { RichTextLine } from "@levitate/tui-kit";
import { Box } from "ink";
import type { StyledRow } from "../../domain/render-ast/types";

type StyledRowsProps = {
	rows: ReadonlyArray<StyledRow>;
};

export function StyledRows({ rows }: StyledRowsProps) {
	return (
		<Box flexDirection="column">
			{rows.map((row, rowIndex) => (
				<RichTextLine key={`${row.kind}-${rowIndex}`} runs={row.runs} fallbackIntent="text" />
			))}
		</Box>
	);
}
