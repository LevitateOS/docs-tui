import { createTheme, type TuiTheme } from "@levitate/tui-kit";

export function createInstallDocsTheme(): TuiTheme {
	return createTheme(
		{
			border: {
				truecolor: "#e5e7eb",
				ansi256: 255,
				ansi16: "white",
			},
			sidebarBorder: {
				truecolor: "#f8fafc",
				ansi256: 255,
				ansi16: "white",
			},
			sidebarBackground: {
				truecolor: "#1e3a8a",
				ansi256: 19,
				ansi16: "blue",
			},
			contentBackground: {
				truecolor: "#111827",
				ansi256: 234,
				ansi16: "black",
			},
			headerBackground: "#0f172a",
			headerAccentBackground: "#1d4ed8",
			footerBackground: "#0f172a",
			sidebarSectionText: {
				truecolor: "#e2e8f0",
				ansi256: 255,
				ansi16: "white",
			},
			sidebarItemText: {
				truecolor: "#dbeafe",
				ansi256: 189,
				ansi16: "white",
			},
			sidebarItemActiveText: {
				truecolor: "#0f172a",
				ansi256: 17,
				ansi16: "black",
			},
			sidebarItemActiveBackground: {
				truecolor: "#cbd5e1",
				ansi256: 251,
				ansi16: "white",
			},
			text: "#e5e7eb",
			dimText: "#94a3b8",
			accent: {
				truecolor: "#facc15",
				ansi256: 220,
				ansi16: "yellow",
			},
			info: "#93c5fd",
			warning: "#facc15",
			sectionHeading: "#f8fafc",
			sectionSubheading: "#93c5fd",
			cardBorder: "#475569",
			cardBackground: "#1f2937",
		},
		{
			sidebarWidth: 30,
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
			sidebarHeaderMode: "all-section-headers",
		},
	);
}
