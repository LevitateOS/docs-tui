import { Box } from "ink";
import type { DocsViewport } from "../../../rendering/pipeline/viewport";
import { StyledRows } from "../../../rendering/pipeline/ast-paint";

export function InstallContentPane({ viewport }: { viewport: DocsViewport }) {
	return (
		<Box flexDirection="column">
			<StyledRows rows={viewport.bodyRows} />
		</Box>
	);
}
