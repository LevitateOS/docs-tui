import { createTheme, type TuiTheme } from "@levitate/tui-kit";

export function createInstallDocsTheme(): TuiTheme {
	return createTheme(
		{
			background: "default",
			border: {
				truecolor: "#8a8a8a",
				ansi256: 245,
				ansi16: "gray",
			},
			sidebarBorder: {
				truecolor: "#8a8a8a",
				ansi256: 245,
				ansi16: "gray",
			},
			sidebarBackground: "default",
			contentBackground: "default",
			headerBackground: "default",
			headerAccentBackground: "default",
			footerBackground: "default",
			sidebarSectionText: {
				truecolor: "#d0d0d0",
				ansi256: 252,
				ansi16: "white",
			},
			sidebarItemText: {
				truecolor: "#b8b8b8",
				ansi256: 249,
				ansi16: "gray",
			},
			sidebarItemActiveText: {
				truecolor: "#111111",
				ansi256: 233,
				ansi16: "black",
			},
			sidebarItemActiveBackground: "default",
			text: "#d4d4d4",
			dimText: "#8f8f8f",
			accent: {
				truecolor: "#d4d4d4",
				ansi256: 253,
				ansi16: "white",
			},
			info: "#d4d4d4",
			warning: "#d4d4d4",
			commandBarBackground: "default",
			commandPrompt: "#d4d4d4",
			warningBackground: "default",
			sectionHeading: "#dcdcdc",
			sectionSubheading: "#c4c4c4",
			cardBorder: "#3a3a3a",
			cardBackground: "default",
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
