import { useMemo, useState } from "react";
import { useListNavigation } from "@levitate/tui-kit";
import type { FlatDocsNavItem } from "../../../domain/content/contracts";
import {
	buildNavSectionSpans,
	findSectionIndexForPageIndex,
	jumpToSectionStart,
} from "../../../domain/navigation/nav-model";
import { resolveInitialDocSelection } from "../../../rendering/pipeline/viewport";

type InstallNavigationState = {
	currentIndex: number;
	safeIndex: number;
	currentSectionIndex: number;
	sectionCount: number;
	startupNote?: string;
	movePage: (delta: number) => void;
	moveSection: (delta: number) => void;
	setPage: (index: number) => void;
	clearStartupNote: () => void;
};

export function useInstallNavigation(
	navItems: ReadonlyArray<FlatDocsNavItem>,
	initialSlug?: string,
): InstallNavigationState {
	const initialSelection = useMemo(
		() => resolveInitialDocSelection(navItems, initialSlug),
		[initialSlug, navItems],
	);
	const sectionSpans = useMemo(() => buildNavSectionSpans(navItems), [navItems]);
	const indexState = useListNavigation(navItems.length, initialSelection.index);

	const [startupNote, setStartupNote] = useState<string | undefined>(
		initialSelection.unknownSlug
			? `unknown slug '${initialSelection.unknownSlug}', showing '${navItems[0]?.slug ?? "index"}'`
			: undefined,
	);

	const safeIndex = indexState.safeIndex;

	const movePage = (delta: number) => {
		indexState.moveBy(delta);
		setStartupNote(undefined);
	};

	const moveSection = (delta: number) => {
		indexState.setIndex(jumpToSectionStart(sectionSpans, indexState.safeIndex, delta));
		setStartupNote(undefined);
	};

	const setPage = (index: number) => {
		indexState.setIndex(index);
		setStartupNote(undefined);
	};

	return {
		currentIndex: indexState.currentIndex,
		safeIndex,
		currentSectionIndex: findSectionIndexForPageIndex(sectionSpans, safeIndex),
		sectionCount: sectionSpans.length,
		startupNote,
		movePage,
		moveSection,
		setPage,
		clearStartupNote: () => setStartupNote(undefined),
	};
}
