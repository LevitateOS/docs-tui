import { resolveIntentColor, type ColorIntent, useTuiColors, useTuiTheme } from "@levitate/tui-kit";

export function useIntentColor(intent: ColorIntent): string | undefined {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	return resolveIntentColor(theme, intent, colors);
}
