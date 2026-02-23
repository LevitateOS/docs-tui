import { useApp } from "ink";
import { useState } from "react";
import {
	SurfaceFrame,
	UiText,
	resolveSurfaceFrameGeometry,
	truncateLine,
	useHotkeys,
	useScrollState,
	useTuiTheme,
	useTuiViewport,
} from "@levitate/tui-kit";
import type { DocsContentLike, FlatDocsNavItem } from "../../../domain/content/contracts";
import { computeDocsViewport } from "../../../rendering/pipeline/viewport";
import { InstallContentPane } from "../components/content-pane";
import { InstallSidebar, type SidebarMode } from "../components/sidebar";
import { installStatusBar } from "../components/status-bar";
import { useInstallNavigation } from "../hooks/use-install-navigation";

type InstallViewerScreenProps = {
	navItems: ReadonlyArray<FlatDocsNavItem>;
	getContent: (slug: string, title: string) => DocsContentLike;
	initialSlug?: string;
	title?: string;
	onExit?: () => void;
};

export function InstallViewerScreen({
	navItems,
	getContent,
	initialSlug,
	title = "LevitateOS Field Manual",
	onExit,
}: InstallViewerScreenProps) {
	const { exit } = useApp();
	const theme = useTuiTheme();
	const viewport = useTuiViewport();
	const navigation = useInstallNavigation(navItems, initialSlug);
	const scroll = useScrollState(0);
	const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() =>
		theme.chrome.sidebarHeaderMode === "all-section-headers" ? "all-sections" : "focus-section",
	);

	const quit = () => {
		onExit?.();
		exit();
	};

	useHotkeys(["q", "escape", "C-c"], quit);
	if (navItems.length === 0) {
		return (
			<SurfaceFrame
				title={title}
				footer="q quit"
				leftWidth={theme.layout.sidebarWidth}
				showHeader={false}
				leftPane={{
					title: "Installation Docs",
					titleMode: "inline",
					body: "(no docs pages)",
					borderIntent: "sidebarBorder",
					backgroundIntent: "sidebarBackground",
					textIntent: "sidebarItemText",
					titleIntent: "sidebarSectionText",
				}}
				rightPane={{
					title: "Overview",
					titleMode: "inline",
					body: <UiText>No docs pages are available.</UiText>,
					borderIntent: "cardBorder",
					backgroundIntent: "contentBackground",
					textIntent: "text",
					titleIntent: "sectionHeading",
				}}
			/>
		);
	}

	const currentItem = navItems[navigation.safeIndex]!;
	const geometry = resolveSurfaceFrameGeometry({
		columns: viewport.columns,
		rows: viewport.rows,
		requestedLeftWidth: theme.layout.sidebarWidth,
		headerHeight: theme.layout.headerHeight,
		footerHeight: theme.layout.footerHeight,
		hasFooter: true,
		hasHeader: false,
		gutterColumns: theme.chrome.framePaneGap,
		leftTitleRows: 2,
		rightTitleRows: 2,
	});
	const contentRows = Math.max(1, geometry.rightTextRows);
	const contentColumns = Math.max(1, geometry.rightTextColumns);
	const sidebarMaxWidth = Math.max(1, geometry.leftTextColumns);

	const content = getContent(currentItem.slug, currentItem.title);
	const docsViewport = computeDocsViewport(
		content,
		currentItem.slug,
		scroll.scrollOffset,
		contentRows,
		contentColumns,
	);

	const movePage = (delta: number) => {
		navigation.movePage(delta);
		scroll.reset();
	};

	const moveSection = (delta: number) => {
		navigation.moveSection(delta);
		scroll.reset();
	};

	const scrollBy = (delta: number) => {
		scroll.scrollBy(delta, docsViewport.maxScroll);
		navigation.clearStartupNote();
	};

	useHotkeys(["left", "h"], () => movePage(-1));
	useHotkeys(["right", "l"], () => movePage(1));
	useHotkeys(["[", "{"], () => moveSection(-1));
	useHotkeys(["]", "}"], () => moveSection(1));
	useHotkeys(["up", "k"], () => scrollBy(-1));
	useHotkeys(["down", "j"], () => scrollBy(1));
	useHotkeys(["pageup", "b"], () => scrollBy(-10));
	useHotkeys(["pagedown", "space"], () => scrollBy(10));
	useHotkeys(["tab"], () => {
		setSidebarMode((previous) => (previous === "focus-section" ? "all-sections" : "focus-section"));
	});
	useHotkeys(["g", "home"], () => {
		scroll.scrollToTop();
		navigation.clearStartupNote();
	});
	useHotkeys(["G", "end", "S-g"], () => {
		scroll.scrollToBottom(docsViewport.maxScroll);
		navigation.clearStartupNote();
	});

	const sidebar = (
		<InstallSidebar
			items={navItems}
			selectedIndex={navigation.safeIndex}
			maxWidth={sidebarMaxWidth}
			currentSection={currentItem.sectionTitle}
			mode={sidebarMode}
		/>
	);
	const footer = installStatusBar(navigation.safeIndex, navItems.length, navigation.startupNote);
	const contentPaneMeta = `${docsViewport.startLine}-${docsViewport.endLine}/${Math.max(docsViewport.totalLines, 1)}`;
	const contentPaneTitle = truncateLine(
		`${currentItem.title}  ${contentPaneMeta}`,
		Math.max(1, geometry.rightTextColumns),
	);

	return (
		<SurfaceFrame
			title={title}
			footer={footer}
			leftWidth={theme.layout.sidebarWidth}
			showHeader={false}
			leftPane={{
				title: "Installation Docs",
				titleMode: "inline",
				body: sidebar,
				borderIntent: "sidebarBorder",
				backgroundIntent: "sidebarBackground",
				textIntent: "sidebarItemText",
				titleIntent: "sidebarSectionText",
			}}
			rightPane={{
				title: contentPaneTitle,
				titleMode: "inline",
				body: <InstallContentPane viewport={docsViewport} />,
				borderIntent: "cardBorder",
				backgroundIntent: "contentBackground",
				textIntent: "text",
				titleIntent: "sectionHeading",
			}}
		/>
	);
}
