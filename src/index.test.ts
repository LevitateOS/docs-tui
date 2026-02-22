import { describe, expect, it } from "bun:test";
import { contentBySlug, docsNav } from "@levitate/docs-content";
import {
  flattenDocsNav,
  renderDocsHeader,
  renderDocsPageLines,
  renderDocsSidebar,
} from "@levitate/tui-kit/docs";
import { docsCliHelpText, parseCliArgs } from "./index";
import { createDocsTuiTheme } from "./theme";
import { computeDocsViewport, resolveInitialDocIndex, resolveInitialDocSelection } from "./tui-blessed";

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function collectSyntaxSnapshotIssues(
  slug: string,
  blocks: ReadonlyArray<unknown>,
  issues: string[],
  pathPrefix: string,
): void {
  for (const [index, rawBlock] of blocks.entries()) {
    const path = `${pathPrefix}[${index}]`;
    if (typeof rawBlock !== "object" || rawBlock === null) {
      issues.push(`${slug}:${path} malformed block`);
      continue;
    }
    const block = rawBlock as Record<string, unknown>;
    const blockType = typeof block.type === "string" ? block.type : "(unknown)";

    if (blockType === "code") {
      if (typeof block.language !== "string" || block.language.trim().length === 0) {
        issues.push(`${slug}:${path} missing code language`);
      }
      if (!hasStringArray(block.highlightedLines)) {
        issues.push(`${slug}:${path} missing code highlightedLines`);
      }
    }

    if (blockType === "command") {
      if (typeof block.language !== "string" || block.language.trim().length === 0) {
        issues.push(`${slug}:${path} missing command language`);
      }
      if (!hasStringArray(block.highlightedCommandLines)) {
        issues.push(`${slug}:${path} missing command highlightedCommandLines`);
      }
    }

    if (blockType === "qa" && Array.isArray(block.items)) {
      for (const [itemIndex, item] of block.items.entries()) {
        if (typeof item !== "object" || item === null) {
          issues.push(`${slug}:${path}.items[${itemIndex}] malformed QA item`);
          continue;
        }
        const answer = (item as { answer?: unknown }).answer;
        if (!Array.isArray(answer)) {
          issues.push(`${slug}:${path}.items[${itemIndex}] missing QA answer`);
          continue;
        }
        collectSyntaxSnapshotIssues(
          slug,
          answer,
          issues,
          `${path}.items[${itemIndex}].answer`,
        );
      }
    }
  }
}

describe("cli parsing", () => {
  it("defaults to interactive mode without flags", () => {
    expect(parseCliArgs([])).toEqual({ help: false, slug: undefined });
  });

  it("accepts --slug and short -s", () => {
    expect(parseCliArgs(["--slug", "getting-started"])).toEqual({
      help: false,
      slug: "getting-started",
    });
    expect(parseCliArgs(["--slug=installation"])).toEqual({
      help: false,
      slug: "installation",
    });
    expect(parseCliArgs(["-s", "installation"])).toEqual({
      help: false,
      slug: "installation",
    });
  });

  it("rejects removed legacy flags", () => {
    const legacy = parseCliArgs(["--list"]);
    expect(legacy.help).toBe(false);
    expect(legacy.error?.includes("removed")).toBe(true);

    const legacyWithValue = parseCliArgs(["--page=getting-started"]);
    expect(legacyWithValue.help).toBe(false);
    expect(legacyWithValue.error?.includes("removed")).toBe(true);
  });

  it("rejects malformed slug flag", () => {
    const missing = parseCliArgs(["--slug"]);
    expect(missing.error?.includes("requires")).toBe(true);

    const missingInline = parseCliArgs(["--slug="]);
    expect(missingInline.error?.includes("requires")).toBe(true);
  });

  it("renders help text with interactive usage", () => {
    const help = docsCliHelpText();
    expect(help.includes("LevitateOS Docs TUI")).toBe(true);
    expect(help.includes("--slug")).toBe(true);
    expect(help.includes("Legacy non-interactive flags")).toBe(true);
  });
});

describe("docs rendering via tui-kit", () => {
  const navItems = flattenDocsNav(docsNav);

  it("maps docs navigation into flat slugs", () => {
    expect(navItems.length).toBeGreaterThan(0);
    expect(navItems.every((item) => item.slug.length > 0)).toBe(true);
  });

  it("all nav slugs resolve to docs content", () => {
    const missing = navItems
      .map((item) => item.slug)
      .filter((slug) => contentBySlug[slug] === undefined);
    expect(missing).toEqual([]);
  });

  it("renders every page through tui-kit docs helpers", () => {
    for (const item of navItems) {
      const content = contentBySlug[item.slug];
      expect(content).toBeDefined();
      if (!content) {
        continue;
      }

      const pageLines = renderDocsPageLines(content, 80);
      expect(pageLines.length).toBeGreaterThan(0);

      const header = renderDocsHeader(content, item.slug, 0, pageLines.length, 20, 80);
      expect(header.length).toBe(4);
    }
  });

  it("ships syntax snapshot payloads for code and command blocks", () => {
    const issues: string[] = [];

    for (const [slug, content] of Object.entries(contentBySlug)) {
      for (const [sectionIndex, section] of content.sections.entries()) {
        collectSyntaxSnapshotIssues(
          slug,
          section.content,
          issues,
          `sections[${sectionIndex}].content`,
        );
      }
    }

    expect(issues).toEqual([]);
  });

  it("renders sidebar with selected marker", () => {
    const sidebar = renderDocsSidebar(navItems, 1, { maxWidth: 30 });
    expect(sidebar.includes(">")).toBe(true);
  });
});

describe("initial page selection", () => {
  const navItems = flattenDocsNav(docsNav);

  it("starts from requested slug when available", () => {
    const idx = resolveInitialDocIndex(navItems, navItems[1]?.slug);
    expect(idx).toBe(1);
  });

  it("falls back to first page for unknown slug", () => {
    expect(resolveInitialDocIndex(navItems, "missing-slug")).toBe(0);

    const selection = resolveInitialDocSelection(navItems, "missing-slug");
    expect(selection.index).toBe(0);
    expect(selection.unknownSlug).toBe("missing-slug");
  });
});

describe("viewport calculations", () => {
  it("clamps oversized scroll while preserving header line ranges", () => {
    const viewport = computeDocsViewport(
      {
        title: "Deep page",
        intro: "Intro",
        sections: [
          {
            title: "Long section",
            content: [{ type: "text", content: "alpha ".repeat(500) }],
          },
        ],
      },
      "deep-page",
      Number.MAX_SAFE_INTEGER,
      12,
      40,
    );

    expect(viewport.maxScroll).toBeGreaterThan(0);
    expect(viewport.scrollOffset).toBe(viewport.maxScroll);
    expect(viewport.startLine).toBeLessThanOrEqual(viewport.endLine);
    expect(viewport.endLine).toBeLessThanOrEqual(viewport.totalLines);
    expect(viewport.bodyLines.length).toBeLessThanOrEqual(viewport.visibleRows);
    expect(
      viewport.headerLines[2]?.includes(
        `(${viewport.startLine}-${viewport.endLine}/${viewport.totalLines})`,
      ),
    ).toBe(true);
  });
});

describe("docs theme", () => {
  it("uses a docs-specific palette and layout", () => {
    const theme = createDocsTuiTheme();
    expect(theme.layout.sidebarWidth).toBe(34);
    expect(theme.layout.minColumns).toBe(90);
    expect(theme.colors.text.truecolor).toBe("#e5e7eb");
    expect(theme.colors.accent.ansi16).toBe("cyan");
    expect(theme.colors.warning.ansi256).toBe(220);
  });
});
