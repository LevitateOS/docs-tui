import { TreeNav, useTuiTheme } from "@levitate/tui-kit";
import type { ReactNode } from "react";
import type { FlatDocsNavItem } from "../../../domain/content/contracts";

export type SidebarMode = "focus-section" | "all-sections";

type InstallSidebarProps = {
	items: ReadonlyArray<FlatDocsNavItem>;
	selectedIndex: number;
	maxWidth: number;
	currentSection?: string;
	mode?: SidebarMode;
};

export function InstallSidebar({
	items,
	selectedIndex,
	maxWidth,
	currentSection,
	mode = "focus-section",
}: InstallSidebarProps): ReactNode {
	const theme = useTuiTheme();
	const omitActiveSectionHeader = theme.chrome.sidebarHeaderMode === "current-section-title";
	return (
		<TreeNav
			items={items.map((item) => ({
				key: item.slug,
				section: item.sectionTitle,
				label: item.title,
			}))}
			selectedIndex={selectedIndex}
			maxWidth={maxWidth}
			currentSection={currentSection}
			mode={mode}
			hideActiveSectionHeader={omitActiveSectionHeader}
			emptyLabel="(no docs pages)"
			expandedSectionMarker="▾"
			collapsedSectionMarker="▸"
			activeItemMarker="▸"
			inactiveItemMarker=" "
			sectionIntent="sidebarSectionText"
			collapsedSectionIntent="dimText"
			itemIntent="sidebarItemText"
			activeItemIntent="sidebarItemActiveText"
			activeBackgroundIntent="sidebarItemActiveBackground"
		/>
	);
}
