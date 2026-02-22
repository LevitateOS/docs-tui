import { contentBySlug, docsNav, type DocsContent } from "@levitate/docs-content";
import {
  createScreen,
  ensureTerminalMinimum,
  type ScreenHandle,
} from "@levitate/tui-kit";
import {
  computeDocsViewport,
  flattenDocsNav,
  resolveInitialDocIndex,
  resolveInitialDocSelection,
  startDocsViewer,
  type DocsContentLike,
  type FlatDocsNavItem,
} from "@levitate/tui-kit/docs";
import { createDocsTuiTheme } from "./theme";

export type StartDocsTuiOptions = {
  slug?: string;
};

function missingPage(slug: string, title: string): DocsContent {
  return {
    title,
    intro: `Missing docs page for slug '${slug}'.`,
    sections: [],
  };
}

function contentForSlug(slug: string, title: string): DocsContentLike {
  return contentBySlug[slug] ?? missingPage(slug, title);
}

function startWithScreen(
  screen: ScreenHandle,
  navItems: ReadonlyArray<FlatDocsNavItem>,
  options: StartDocsTuiOptions,
): void {
  const viewer = startDocsViewer({
    screen,
    navItems,
    getContent: contentForSlug,
    initialSlug: options.slug,
    title: "LevitateOS Docs",
  });

  const disposeViewer = () => {
    viewer.dispose();
  };
  screen.on("destroy", disposeViewer);
}

export function startTUI(options: StartDocsTuiOptions = {}): void {
  const navItems = flattenDocsNav(docsNav);
  if (navItems.length === 0) {
    throw new Error("No docs pages are available.");
  }

  const screen = createScreen({
    title: "levitate-docs",
    quitKeybinds: [],
    theme: createDocsTuiTheme(),
  });

  ensureTerminalMinimum(screen);

  try {
    startWithScreen(screen, navItems, options);
  } catch (error: unknown) {
    screen.destroy();
    throw error;
  }
}

export { computeDocsViewport, resolveInitialDocIndex, resolveInitialDocSelection };
