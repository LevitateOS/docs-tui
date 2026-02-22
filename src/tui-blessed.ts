import { contentBySlug, docsNav, type DocsContent } from "@levitate/docs-content";
import {
  clamp,
  createLifecycleScope,
  createScreen,
  createTwoPaneShell,
  ensureTerminalMinimum,
  type DocsRenderStyleContext,
  flattenDocsNav,
  renderDocsHeader,
  renderDocsPageLines,
  renderDocsSidebar,
  styleText,
  type DocsContentLike,
  type FlatDocsNavItem,
  type ScreenHandle,
  type TwoPaneShell,
} from "@levitate/tui-kit";
import { createDocsTuiTheme } from "./theme";

export type StartDocsTuiOptions = {
  slug?: string;
};

export type InitialDocSelection = {
  index: number;
  unknownSlug?: string;
};

export type DocsViewport = {
  headerLines: string[];
  bodyLines: string[];
  totalLines: number;
  visibleRows: number;
  maxScroll: number;
  scrollOffset: number;
  startLine: number;
  endLine: number;
};

function missingPage(slug: string, title: string): DocsContent {
  return {
    title,
    intro: `Missing docs page for slug '${slug}'.`,
    sections: [],
  };
}

function pageForIndex(
  navItems: ReadonlyArray<FlatDocsNavItem>,
  index: number,
): { item: FlatDocsNavItem; content: DocsContentLike } {
  const safeIndex = clamp(index, 0, navItems.length - 1);
  const item = navItems[safeIndex];
  const content = contentBySlug[item.slug] ?? missingPage(item.slug, item.title);
  return { item, content };
}

export function resolveInitialDocSelection(
  navItems: ReadonlyArray<FlatDocsNavItem>,
  slug?: string,
): InitialDocSelection {
  if (navItems.length === 0) {
    return { index: 0 };
  }

  const normalized = slug?.trim() ?? "";
  if (normalized.length === 0) {
    return { index: 0 };
  }

  const index = navItems.findIndex((item) => item.slug === normalized);
  if (index >= 0) {
    return { index };
  }

  return {
    index: 0,
    unknownSlug: normalized,
  };
}

export function resolveInitialDocIndex(
  navItems: ReadonlyArray<FlatDocsNavItem>,
  slug?: string,
): number {
  return resolveInitialDocSelection(navItems, slug).index;
}

export function computeDocsViewport(
  content: DocsContentLike,
  slug: string,
  requestedScrollOffset: number,
  contentInnerRows: number,
  contentWidth: number,
  styleContext?: DocsRenderStyleContext,
): DocsViewport {
  const safeRows = Math.max(1, contentInnerRows);
  const safeWidth = Math.max(20, contentWidth);
  const pageLines = renderDocsPageLines(content, safeWidth, { styleContext });

  const provisionalHeader = renderDocsHeader(
    content,
    slug,
    0,
    pageLines.length,
    safeRows,
    safeWidth,
    { styleContext },
  );
  const visibleRows = Math.max(1, safeRows - provisionalHeader.length);
  const maxScroll = Math.max(0, pageLines.length - visibleRows);
  const scrollOffset = clamp(requestedScrollOffset, 0, maxScroll);
  const headerLines = renderDocsHeader(
    content,
    slug,
    scrollOffset,
    pageLines.length,
    visibleRows,
    safeWidth,
    { styleContext },
  );

  const startLine = pageLines.length === 0 ? 0 : scrollOffset + 1;
  const endLine = pageLines.length === 0 ? 0 : Math.min(pageLines.length, scrollOffset + visibleRows);

  return {
    headerLines,
    bodyLines: pageLines.slice(scrollOffset, scrollOffset + visibleRows),
    totalLines: pageLines.length,
    visibleRows,
    maxScroll,
    scrollOffset,
    startLine,
    endLine,
  };
}

function escapeStyleMarkup(value: string): string {
  return value.replaceAll("[[", "\\[[");
}

function styleWithScreen(screen: ScreenHandle, value: string): string {
  return styleText(value, {
    theme: screen.theme,
    runtime: screen.colors,
  });
}

function docsFooter(
  screen: ScreenHandle,
  currentIndex: number,
  pageCount: number,
  startLine: number,
  endLine: number,
  totalLines: number,
  note?: string,
): string {
  const status = `page ${currentIndex + 1}/${pageCount} | lines ${startLine}-${endLine}/${totalLines}`;
  const normalizedNote = note?.trim();
  const noteSegment =
    normalizedNote && normalizedNote.length > 0
      ? ` | [[fg=$warning bold]]${escapeStyleMarkup(normalizedNote)}[[/]]`
      : "";

  return styleWithScreen(
    screen,
    `[docs] [[fg=$accent bold]]q[[/]] quit | [[fg=$accent bold]]arrows[[/]] navigate | ${status} | [[fg=$accent bold]]h/l[[/]] pages | [[fg=$accent bold]]j/k[[/]] scroll${noteSegment}`,
  );
}

function createDocsShell(screen: ScreenHandle): TwoPaneShell {
  return createTwoPaneShell(screen, {
    title: "LevitateOS Docs",
    sidebarContent: "",
    footerText: styleWithScreen(
      screen,
      "[docs] [[fg=$accent bold]]q[[/]] quit | [[fg=$accent bold]]arrows[[/]] navigate | [[fg=$accent bold]]h/l[[/]] pages | [[fg=$accent bold]]j/k[[/]] scroll",
    ),
    contentScrollable: false,
  });
}

export function startTUI(options: StartDocsTuiOptions = {}): void {
  const navItems = flattenDocsNav(docsNav);
  if (navItems.length === 0) {
    throw new Error("No docs pages are available.");
  }

  const selection = resolveInitialDocSelection(navItems, options.slug);
  let startupNotice =
    selection.unknownSlug === undefined
      ? undefined
      : `unknown slug '${selection.unknownSlug}', showing '${navItems[0]?.slug ?? "index"}'`;
  let currentIndex = selection.index;
  let scrollOffset = 0;
  let stopping = false;

  const scope = createLifecycleScope("docs.tui");
  const screen = createScreen({
    title: "levitate-docs",
    quitKeybinds: [],
    theme: createDocsTuiTheme(),
  });
  scope.onDispose(() => {
    if (stopping) {
      return;
    }
    stopping = true;
    screen.destroy();
  });

  ensureTerminalMinimum(screen);
  let shell = createDocsShell(screen);

  const clearStartupNotice = () => {
    startupNotice = undefined;
  };

  const render = () => {
    const { item, content } = pageForIndex(navItems, currentIndex);
    const contentWidth = Math.max(20, shell.geometry.contentInnerColumns);
    const sidebarWidth = Math.max(20, shell.geometry.sidebarColumns - 2);
    const styleContext: DocsRenderStyleContext = {
      theme: screen.theme,
      colors: screen.colors,
    };
    const viewport = computeDocsViewport(
      content,
      item.slug,
      scrollOffset,
      shell.geometry.contentInnerRows,
      contentWidth,
      styleContext,
    );

    scrollOffset = viewport.scrollOffset;

    shell.header.setContent(`${content.title} (${item.slug})`);
    shell.sidebar.setContent(
      renderDocsSidebar(navItems, currentIndex, { maxWidth: sidebarWidth, styleContext }),
    );
    shell.content.setContent([...viewport.headerLines, ...viewport.bodyLines].join("\n"));
    shell.footer.setContent(
      docsFooter(
        screen,
        currentIndex,
        navItems.length,
        viewport.startLine,
        viewport.endLine,
        viewport.totalLines,
        startupNotice,
      ),
    );
    screen.render();
  };

  const movePage = (delta: number) => {
    const nextIndex = clamp(currentIndex + delta, 0, navItems.length - 1);
    if (nextIndex === currentIndex) {
      return;
    }
    currentIndex = nextIndex;
    scrollOffset = 0;
    clearStartupNotice();
    render();
  };

  const scrollBy = (delta: number) => {
    if (delta === 0) {
      return;
    }
    const nextOffset = Math.max(0, scrollOffset + delta);
    if (nextOffset === scrollOffset) {
      return;
    }
    scrollOffset = nextOffset;
    clearStartupNotice();
    render();
  };

  const scrollToTop = () => {
    if (scrollOffset === 0) {
      return;
    }
    scrollOffset = 0;
    clearStartupNotice();
    render();
  };

  const scrollToBottom = () => {
    scrollOffset = Number.MAX_SAFE_INTEGER;
    clearStartupNotice();
    render();
  };

  const quit = () => {
    scope.dispose();
  };

  scope.bindEvent(screen, "resize", () => {
    shell = createDocsShell(screen);
    render();
  });

  scope.bindKey(screen, ["q", "escape", "C-c"], () => {
    quit();
  });
  scope.bindKey(screen, ["left", "h"], () => {
    movePage(-1);
  });
  scope.bindKey(screen, ["right", "l"], () => {
    movePage(1);
  });
  scope.bindKey(screen, ["up", "k"], () => {
    scrollBy(-1);
  });
  scope.bindKey(screen, ["down", "j"], () => {
    scrollBy(1);
  });
  scope.bindKey(screen, ["pageup", "b"], () => {
    scrollBy(-10);
  });
  scope.bindKey(screen, ["pagedown", "space"], () => {
    scrollBy(10);
  });
  scope.bindKey(screen, ["g", "home"], () => {
    scrollToTop();
  });
  scope.bindKey(screen, ["G", "end", "S-g"], () => {
    scrollToBottom();
  });

  render();
}
