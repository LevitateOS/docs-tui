import { describe, expect, it } from "bun:test";
import { contentBySlug, docsNav, metaBySlug } from "@levitate/docs-content";
import { createInstallSession } from "./app/session";
import { installDocsCliHelpText } from "./cli/help";
import { parseCliArgs } from "./cli/parse-args";
import { getDistroProfile } from "./domain/distro/registry";
import {
	buildNavSectionSpans,
	findSectionIndexForPageIndex,
	flattenDocsNav,
	jumpToSectionStart,
} from "./domain/navigation/nav-model";
import { resolveAllowedSlugs } from "./domain/scope/allowed-slugs";
import { createInstallDocsTheme } from "./presentation/ink/theme";
import { buildDocumentAst } from "./rendering/pipeline/ast-build";
import { layoutDocumentRows } from "./rendering/pipeline/ast-layout";
import {
	computeDocsViewport,
	resolveInitialDocIndex,
	resolveInitialDocSelection,
} from "./rendering/pipeline/viewport";

function hasStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function rowToText(row: { runs: Array<{ text: string }> } | undefined): string {
	if (!row) {
		return "";
	}
	return row.runs.map((run) => run.text).join("");
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
				collectSyntaxSnapshotIssues(slug, answer, issues, `${path}.items[${itemIndex}].answer`);
			}
		}
	}
}

describe("cli parsing", () => {
	it("defaults to interactive mode without flags", () => {
		expect(parseCliArgs([])).toEqual({ help: false, slug: undefined });
	});

	it("accepts --slug and short -s", () => {
		expect(parseCliArgs(["--slug", "installation"])).toEqual({
			help: false,
			slug: "installation",
		});
		expect(parseCliArgs(["--slug=recstrap"])).toEqual({
			help: false,
			slug: "recstrap",
		});
		expect(parseCliArgs(["-s", "recchroot"])).toEqual({
			help: false,
			slug: "recchroot",
		});
	});

	it("rejects removed legacy flags", () => {
		const legacy = parseCliArgs(["--list"]);
		expect(legacy.help).toBe(false);
		expect(legacy.error?.includes("removed")).toBe(true);

		const legacyWithValue = parseCliArgs(["--page=installation"]);
		expect(legacyWithValue.help).toBe(false);
		expect(legacyWithValue.error?.includes("removed")).toBe(true);
	});

	it("rejects malformed slug flag", () => {
		const missing = parseCliArgs(["--slug"]);
		expect(missing.error?.includes("requires")).toBe(true);

		const missingInline = parseCliArgs(["--slug="]);
		expect(missingInline.error?.includes("requires")).toBe(true);
	});

	it("renders install-focused help text", () => {
		const help = installDocsCliHelpText();
		expect(help.includes("LevitateOS Docs TUI")).toBe(true);
		expect(help.includes("levitate-install-docs")).toBe(true);
		expect(help.includes("Legacy non-interactive flags")).toBe(true);
		expect(help.includes("[ / ]")).toBe(true);
		expect(help.includes("Toggle sidebar mode")).toBe(true);
	});
});

describe("docs navigation scope", () => {
	const source = {
		docsNav,
		contentBySlug,
		metaBySlug,
	};

	it("resolves allowed slugs from docs navigation", () => {
		const allowed = resolveAllowedSlugs(source);

		expect(allowed.includes("installation")).toBe(true);
		expect(allowed.includes("recstrap")).toBe(true);
		expect(allowed.includes("recipe-format")).toBe(true);
		expect(allowed.includes("helpers-install")).toBe(true);
	});

	it("rejects unknown slug in session creation", () => {
		const profile = getDistroProfile("levitate");
		expect(() => createInstallSession(source, profile, "missing-page")).toThrow(
			"not available in docs navigation",
		);
	});

	it("creates a valid docs session for known slug", () => {
		const profile = getDistroProfile("levitate");
		const session = createInstallSession(source, profile, "recipe-format");

		expect(session.navItems.length).toBeGreaterThan(0);
		expect(session.initialSlug).toBe("recipe-format");
		expect(session.allowedSlugs.includes("recipe-format")).toBe(true);
		expect(session.navItems.length).toBeGreaterThan(20);
	});

	it("falls back to first nav item when profile default slug is missing", () => {
		const profile = {
			...getDistroProfile("levitate"),
			defaultSlug: "missing-default-slug",
		};
		const session = createInstallSession(source, profile);

		expect(session.navItems.length).toBeGreaterThan(0);
		expect(session.initialSlug).toBe(session.navItems[0]?.slug);
	});
});

describe("rendering and viewport", () => {
	const source = {
		docsNav,
		contentBySlug,
		metaBySlug,
	};
	const profile = getDistroProfile("levitate");
	const session = createInstallSession(source, profile, "installation");
	const navItems = session.navItems;

	it("maps filtered nav into flat slugs", () => {
		expect(navItems.length).toBeGreaterThan(0);
		expect(navItems.every((item) => item.slug.length > 0)).toBe(true);
	});

	it("all visible slugs resolve to docs content", () => {
		const missing = navItems
			.map((item) => item.slug)
			.filter((slug) => contentBySlug[slug] === undefined);
		expect(missing).toEqual([]);
	});

	it("renders every install page through pipeline helpers", () => {
		for (const item of navItems) {
			const content = contentBySlug[item.slug];
			expect(content).toBeDefined();
			if (!content) {
				continue;
			}

			const ast = buildDocumentAst(content, item.slug);
			expect(ast.sections.length).toBeGreaterThan(0);

			const rows = layoutDocumentRows(ast, 80);
			expect(rows.length).toBeGreaterThan(0);
			expect(rows.some((row) => row.kind === "heading")).toBe(true);
		}
	});

	it("ships syntax snapshot payloads for code and command blocks", () => {
		const issues: string[] = [];

		for (const item of navItems) {
			const content = contentBySlug[item.slug];
			if (!content) {
				continue;
			}

			for (const [sectionIndex, section] of content.sections.entries()) {
				collectSyntaxSnapshotIssues(
					item.slug,
					section.content,
					issues,
					`sections[${sectionIndex}].content`,
				);
			}
		}

		expect(issues).toEqual([]);
	});

	it("avoids decorative separator rules in layout rows", () => {
		const content = contentBySlug[navItems[0]?.slug ?? ""];
		expect(content).toBeDefined();
		if (!content) {
			return;
		}
		const ast = buildDocumentAst(content, navItems[0]?.slug ?? "page");
		const rows = layoutDocumentRows(ast, 80);
		const text = rows.map((row) => rowToText(row)).join("\n");

		expect(text.includes("-----")).toBe(false);
		expect(text.includes("=====")).toBe(false);
	});

	it("applies rich row styling intents for structured blocks", () => {
		const ast = buildDocumentAst(
			{
				title: "Styled page",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
				sections: [
					{
						title: "Styles",
						content: [
							{
								type: "code",
								language: "bash",
								content: "echo hi",
								highlightedLines: ["echo hi"],
							},
							{
								type: "command",
								language: "bash",
								description: "Run the command",
								command: "echo hi",
								highlightedCommandLines: ["echo hi"],
								output: "hi",
							},
							{
								type: "table",
								headers: ["name", "value"],
								rows: [["a", "1"]],
							},
							{
								type: "note",
								variant: "warning",
								content: "careful",
							},
						],
					},
				],
			},
			"styled-page",
		);
		const rows = layoutDocumentRows(ast, 80);

		expect(
			rows.some(
				(row) =>
					row.kind === "code" && row.runs.some((run) => run.backgroundIntent === "cardBackground"),
			),
		).toBe(true);
		expect(
			rows.some(
				(row) =>
					row.kind === "command" &&
					row.runs.some((run) => run.backgroundIntent === "commandBarBackground"),
			),
		).toBe(true);
		expect(
			rows.some(
				(row) =>
					row.kind === "table" && row.runs.some((run) => run.backgroundIntent === "cardBackground"),
			),
		).toBe(true);
		expect(
			rows.some((row) => row.kind === "note" && row.runs.some((run) => run.backgroundIntent)),
		).toBe(true);
	});

	it("preserves syntax snapshot colors for code and command lines", () => {
		const ast = buildDocumentAst(
			{
				title: "Syntax colors",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
				sections: [
					{
						title: "Syntax",
						content: [
							{
								type: "code",
								language: "bash",
								content: "echo hi",
								highlightedLines: ["[[fg=#b392f0]]echo[[/]][[fg=#e1e4e8]] hi[[/]]"],
							},
							{
								type: "command",
								language: "bash",
								description: "Run",
								command: "echo hi",
								highlightedCommandLines: ["[[fg=#b392f0]]echo[[/]][[fg=#e1e4e8]] hi[[/]]"],
								output: "",
							},
						],
					},
				],
			},
			"syntax-colors",
		);
		const rows = layoutDocumentRows(ast, 80);

		expect(
			rows.some((row) =>
				row.runs.some((run) => run.literalColor === "#b392f0" || run.literalColor === "#e1e4e8"),
			),
		).toBe(true);
	});

	it("preserves syntax snapshot colors after wrapped line splits", () => {
		const ast = buildDocumentAst(
			{
				title: "Syntax wrap colors",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
				sections: [
					{
						title: "Wrapped syntax",
						content: [
							{
								type: "code",
								language: "bash",
								content: "echo hithere",
								highlightedLines: ["[[fg=#b392f0]]echo[[/]][[fg=#e1e4e8]] hithere[[/]]"],
							},
							{
								type: "command",
								language: "bash",
								description: "Run",
								command: "echo hithere",
								highlightedCommandLines: ["[[fg=#b392f0]]echo[[/]][[fg=#e1e4e8]] hithere[[/]]"],
								output: "",
							},
						],
					},
				],
			},
			"syntax-wrap-colors",
		);
		const rows = layoutDocumentRows(ast, 8);
		const codeLiteralColors = rows
			.filter((row) => row.kind === "code")
			.flatMap((row) => row.runs.map((run) => run.literalColor));
		const commandLiteralColors = rows
			.filter((row) => row.kind === "command")
			.flatMap((row) => row.runs.map((run) => run.literalColor));

		expect(codeLiteralColors.includes("#b392f0")).toBe(true);
		expect(codeLiteralColors.includes("#e1e4e8")).toBe(true);
		expect(commandLiteralColors.includes("#b392f0")).toBe(true);
		expect(commandLiteralColors.includes("#e1e4e8")).toBe(true);
	});

	it("preserves link destinations in rendered inline content", () => {
		const ast = buildDocumentAst(
			{
				title: "Links",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
				sections: [
					{
						title: "Read",
						content: [
							{
								type: "text",
								content: [
									"See ",
									{
										type: "link",
										text: "guide",
										href: "https://example.com/guide",
									},
								],
							},
						],
					},
				],
			},
			"links-page",
		);
		const text = layoutDocumentRows(ast, 80)
			.map((row) => rowToText(row))
			.join("\n");

		expect(text.includes("guide (https://example.com/guide)")).toBe(true);
	});

	it("wraps long command lines without dropping content", () => {
		const ast = buildDocumentAst(
			{
				title: "Commands",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
				sections: [
					{
						title: "Wrap",
						content: [
							{
								type: "command",
								language: "bash",
								description: "Run this:",
								command: "recstrap /mnt --variant full --with networking --with docs --with debug",
								highlightedCommandLines: [
									"recstrap /mnt --variant full --with networking --with docs --with debug",
								],
								output: "",
							},
						],
					},
				],
			},
			"command-wrap",
		);
		const rows = layoutDocumentRows(ast, 24);
		const commandText = rows
			.filter((row) => row.kind === "command")
			.map((row) => rowToText(row))
			.join("");

		expect(commandText.includes("--with debug")).toBe(true);
	});

	it("initial selection helpers work", () => {
		const idx = resolveInitialDocIndex(navItems, navItems[1]?.slug);
		expect(idx).toBe(1);

		const selection = resolveInitialDocSelection(navItems, "missing-slug");
		expect(selection.index).toBe(0);
		expect(selection.unknownSlug).toBe("missing-slug");
	});

	it("clamps oversized scroll while preserving line ranges", () => {
		const viewport = computeDocsViewport(
			{
				title: "Deep page",
				meta: {
					product: "levitate",
					scopes: ["install"],
				},
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
		expect(viewport.bodyRows.length).toBeLessThanOrEqual(viewport.visibleRows);
	});
});

describe("theme", () => {
	it("uses install-docs palette and layout", () => {
		const theme = createInstallDocsTheme();
		expect(theme.layout.sidebarWidth).toBe(30);
		expect(theme.layout.minColumns).toBe(88);
		expect(theme.layout.headerHeight).toBe(1);
		expect(theme.colors.text.truecolor).toBe("#e5e7eb");
		expect(theme.colors.accent.truecolor).toBe("#facc15");
		expect(theme.colors.warning.truecolor).toBe("#facc15");
		expect(theme.chrome.titleStyle).toBe("slot");
		expect(theme.chrome.framePaneGap).toBe(0);
		expect(theme.chrome.sidebarHeaderMode).toBe("all-section-headers");
	});
});

describe("flatten helper", () => {
	it("keeps slugs only for docs hrefs", () => {
		const flat = flattenDocsNav(docsNav);
		expect(flat.length).toBeGreaterThan(0);
		expect(flat[0]?.slug.length).toBeGreaterThan(0);
	});

	it("builds section spans and jumps by section boundaries", () => {
		const flat = flattenDocsNav(docsNav);
		const spans = buildNavSectionSpans(flat);

		expect(spans.length).toBeGreaterThan(1);
		expect(spans[0]?.startIndex).toBe(0);
		expect(spans[0]?.endIndex).toBeGreaterThanOrEqual(spans[0]?.startIndex ?? 0);

		const sectionIdx = findSectionIndexForPageIndex(spans, spans[0]?.endIndex ?? 0);
		expect(sectionIdx).toBe(0);

		const nextStart = jumpToSectionStart(spans, spans[0]?.endIndex ?? 0, 1);
		expect(nextStart).toBe(spans[1]?.startIndex ?? 0);
	});
});
