import { createTheme, type TuiTheme } from "@levitate/tui-kit";

export function createInstallDocsTheme(): TuiTheme {
	return createTheme(
		{
			border: {
				truecolor: "#7dbb6b",
				ansi256: 113,
				ansi16: "green",
			},
			sidebarBorder: {
				truecolor: "#8fd97a",
				ansi256: 114,
				ansi16: "green",
			},
			sidebarBackground: {
				truecolor: "#0b1f12",
				ansi256: 22,
				ansi16: "green",
			},
			contentBackground: {
				truecolor: "#040d07",
				ansi256: 232,
				ansi16: "black",
			},
			headerBackground: "#06140c",
			headerAccentBackground: "#103020",
			footerBackground: "#06140c",
			sidebarSectionText: {
				truecolor: "#c8ffb0",
				ansi256: 193,
				ansi16: "green",
			},
			sidebarItemText: {
				truecolor: "#93df7b",
				ansi256: 114,
				ansi16: "green",
			},
			sidebarItemActiveText: {
				truecolor: "#041209",
				ansi256: 22,
				ansi16: "black",
			},
			sidebarItemActiveBackground: {
				truecolor: "#d7ff9c",
				ansi256: 191,
				ansi16: "green",
			},
			text: "#ceffbb",
			dimText: "#6ea062",
			accent: {
				truecolor: "#f5ca6c",
				ansi256: 221,
				ansi16: "yellow",
			},
			info: "#73f2ce",
			warning: "#f5ca6c",
			commandBarBackground: "#0d2518",
			commandPrompt: "#ffe07b",
			warningBackground: "#50380b",
			sectionHeading: "#b7ff9f",
			sectionSubheading: "#8ae8b8",
			cardBorder: "#2f6140",
			cardBackground: "#0b1a11",
		},
		{
			sidebarWidth: 32,
			minColumns: 88,
			headerHeight: 1,
			footerHeight: 1,
		},
		{
			borderGlyphSet: "single",
			titleStyle: "slot",
			panePaddingX: 1,
			panePaddingY: 0,
			framePaneGap: 0,
			sidebarHeaderMode: "current-section-title",
		},
	);
}
