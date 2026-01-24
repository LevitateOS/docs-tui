import { describe, it, expect, beforeAll } from "bun:test"
import {
	docsNav,
	contentBySlug,
	type DocsContent,
	type ContentBlock,
	type RichText,
	type InlineNode,
	type Section,
} from "@levitate/docs-content"

// ============================================================================
// Test Utilities - mirrors the rendering logic
// ============================================================================

function inlineToString(content: string | RichText): string {
	if (typeof content === "string") return content
	return content.map((node: InlineNode) => {
		if (typeof node === "string") return node
		return node.text
	}).join("")
}

function renderBlockToString(block: ContentBlock, width = 60): string[] {
	const lines: string[] = []

	switch (block.type) {
		case "text":
			lines.push(inlineToString(block.content))
			break
		case "code":
			if (block.filename) lines.push(`┌─ ${block.filename}`)
			lines.push("╭" + "─".repeat(width - 2) + "╮")
			for (const line of block.content.split("\n")) {
				lines.push("│ " + line)
			}
			lines.push("╰" + "─".repeat(width - 2) + "╯")
			break
		case "command": {
			lines.push(block.description)
			lines.push("╭" + "─".repeat(width - 2) + "╮")
			const cmd = Array.isArray(block.command) ? block.command.join("\n") : block.command
			for (const line of cmd.split("\n")) {
				lines.push("│ $ " + line)
			}
			lines.push("╰" + "─".repeat(width - 2) + "╯")
			if (block.output) lines.push("→ " + block.output)
			break
		}
		case "list":
			for (let i = 0; i < block.items.length; i++) {
				const item = block.items[i]
				const prefix = block.ordered ? `${i + 1}.` : "•"
				const text = typeof item === "object" && !Array.isArray(item) && "text" in item
					? inlineToString(item.text)
					: inlineToString(item as string | RichText)
				lines.push(`${prefix} ${text}`)
				if (typeof item === "object" && !Array.isArray(item) && "children" in item && item.children) {
					for (const child of item.children) {
						lines.push(`   ◦ ${inlineToString(child)}`)
					}
				}
			}
			break
		case "table": {
			const colW = Math.floor((width - 4) / block.headers.length)
			const header = block.headers.map(h => inlineToString(h).padEnd(colW).slice(0, colW)).join(" │ ")
			lines.push(header)
			lines.push("─".repeat(colW * block.headers.length + (block.headers.length - 1) * 3))
			for (const row of block.rows) {
				const rowStr = row.map(cell => inlineToString(cell).padEnd(colW).slice(0, colW)).join(" │ ")
				lines.push(rowStr)
			}
			break
		}
		case "interactive":
			if (block.intro) lines.push(inlineToString(block.intro))
			for (const step of block.steps) {
				lines.push(`  ${step.command}`)
				lines.push(`    ${inlineToString(step.description)}`)
			}
			break
		case "conversation":
			for (const msg of block.messages) {
				const role = msg.role === "user" ? "You:" : "AI:"
				lines.push(`${role} ${inlineToString(msg.text)}`)
				if (msg.list) {
					for (const item of msg.list) {
						lines.push(`    • ${inlineToString(item)}`)
					}
				}
			}
			break
		case "qa":
			for (const item of block.items) {
				lines.push(`Q: ${inlineToString(item.question)}`)
				lines.push("A:")
				for (const ans of item.answer) {
					const ansLines = renderBlockToString(ans, width - 3)
					for (const line of ansLines) {
						lines.push("   " + line)
					}
				}
			}
			break
	}

	return lines
}

function renderSectionToString(section: Section, width = 60): string[] {
	const lines: string[] = []
	const prefix = section.level === 3 ? "###" : "##"
	lines.push(`${prefix} ${section.title}`)
	lines.push("")
	for (const block of section.content) {
		lines.push(...renderBlockToString(block, width))
		lines.push("")
	}
	return lines
}

function renderPageToString(content: DocsContent, width = 60): string[] {
	const lines: string[] = []
	lines.push("═".repeat(width))
	lines.push(content.title)
	lines.push("═".repeat(width))
	lines.push("")
	if (content.intro) {
		lines.push(inlineToString(content.intro))
		lines.push("")
	}
	for (const section of content.sections) {
		lines.push(...renderSectionToString(section, width))
	}
	return lines
}

// ============================================================================
// Collect all slugs
// ============================================================================

const allSlugs: string[] = []
for (const section of docsNav) {
	for (const item of section.items) {
		allSlugs.push(item.href.replace("/docs/", ""))
	}
}

// ============================================================================
// Tests
// ============================================================================

describe("docs-content package", () => {
	it("should have docsNav with sections", () => {
		expect(docsNav).toBeDefined()
		expect(Array.isArray(docsNav)).toBe(true)
		expect(docsNav.length).toBeGreaterThan(0)
	})

	it("should have contentBySlug with content", () => {
		expect(contentBySlug).toBeDefined()
		expect(typeof contentBySlug).toBe("object")
		expect(Object.keys(contentBySlug).length).toBeGreaterThan(0)
	})

	it("should have all nav items in contentBySlug", () => {
		const missing: string[] = []
		for (const slug of allSlugs) {
			if (!contentBySlug[slug]) {
				missing.push(slug)
			}
		}
		expect(missing).toEqual([])
	})
})

describe("page rendering", () => {
	it.each(allSlugs)("renders page '%s' without error", (slug) => {
		const content = contentBySlug[slug]
		expect(content).toBeDefined()
		expect(content.title).toBeDefined()
		expect(typeof content.title).toBe("string")
		expect(content.title.length).toBeGreaterThan(0)

		// Should not throw
		const lines = renderPageToString(content)
		expect(lines.length).toBeGreaterThan(0)
	})

	it.each(allSlugs)("page '%s' has valid sections", (slug) => {
		const content = contentBySlug[slug]
		expect(Array.isArray(content.sections)).toBe(true)

		for (const section of content.sections) {
			expect(section.title).toBeDefined()
			expect(typeof section.title).toBe("string")
			expect(section.level).toBeOneOf([2, 3, undefined])
			expect(Array.isArray(section.content)).toBe(true)
		}
	})
})

describe("block type rendering", () => {
	// Find pages with specific block types for targeted testing
	function findBlocksOfType(type: string): { slug: string; block: ContentBlock }[] {
		const results: { slug: string; block: ContentBlock }[] = []
		for (const slug of allSlugs) {
			const content = contentBySlug[slug]
			for (const section of content.sections) {
				for (const block of section.content) {
					if (block.type === type) {
						results.push({ slug, block })
					}
				}
			}
		}
		return results
	}

	it("renders text blocks", () => {
		const blocks = findBlocksOfType("text")
		expect(blocks.length).toBeGreaterThan(0)

		for (const { block } of blocks) {
			if (block.type !== "text") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(0)
			expect(lines[0].length).toBeGreaterThan(0)
		}
	})

	it("renders code blocks", () => {
		const blocks = findBlocksOfType("code")
		expect(blocks.length).toBeGreaterThan(0)

		for (const { block } of blocks) {
			if (block.type !== "code") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(2) // At least box top + content + box bottom
			expect(lines.some(l => l.startsWith("╭"))).toBe(true)
			expect(lines.some(l => l.startsWith("╰"))).toBe(true)
		}
	})

	it("renders command blocks", () => {
		const blocks = findBlocksOfType("command")
		expect(blocks.length).toBeGreaterThan(0)

		for (const { block } of blocks) {
			if (block.type !== "command") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(2)
			expect(lines.some(l => l.includes("$"))).toBe(true) // Command prefix
		}
	})

	it("renders list blocks", () => {
		const blocks = findBlocksOfType("list")
		expect(blocks.length).toBeGreaterThan(0)

		for (const { block } of blocks) {
			if (block.type !== "list") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(0)
			// Should have bullet points or numbers
			expect(lines.some(l => l.startsWith("•") || /^\d+\./.test(l))).toBe(true)
		}
	})

	it("renders table blocks", () => {
		const blocks = findBlocksOfType("table")
		expect(blocks.length).toBeGreaterThan(0)

		for (const { block } of blocks) {
			if (block.type !== "table") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(1) // Header + separator + rows
			expect(lines.some(l => l.includes("─"))).toBe(true) // Separator
		}
	})

	it("renders interactive blocks", () => {
		const blocks = findBlocksOfType("interactive")
		// Interactive blocks may not exist in all docs
		if (blocks.length === 0) return

		for (const { block } of blocks) {
			if (block.type !== "interactive") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(0)
		}
	})

	it("renders conversation blocks", () => {
		const blocks = findBlocksOfType("conversation")
		// Conversation blocks may not exist in all docs
		if (blocks.length === 0) return

		for (const { block } of blocks) {
			if (block.type !== "conversation") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(0)
			expect(lines.some(l => l.startsWith("You:") || l.startsWith("AI:"))).toBe(true)
		}
	})

	it("renders qa blocks", () => {
		const blocks = findBlocksOfType("qa")
		// QA blocks may not exist in all docs
		if (blocks.length === 0) return

		for (const { block } of blocks) {
			if (block.type !== "qa") continue
			const lines = renderBlockToString(block)
			expect(lines.length).toBeGreaterThan(0)
			expect(lines.some(l => l.startsWith("Q:"))).toBe(true)
		}
	})
})

describe("inline content rendering", () => {
	it("renders plain strings", () => {
		expect(inlineToString("hello world")).toBe("hello world")
	})

	it("renders rich text arrays", () => {
		const richText: RichText = [
			"Hello ",
			{ type: "bold", text: "world" },
			"!",
		]
		expect(inlineToString(richText)).toBe("Hello world!")
	})

	it("renders code inline", () => {
		const richText: RichText = [
			"Run ",
			{ type: "code", text: "npm install" },
			" to install",
		]
		expect(inlineToString(richText)).toBe("Run npm install to install")
	})

	it("renders links", () => {
		const richText: RichText = [
			"See ",
			{ type: "link", text: "docs", href: "/docs" },
		]
		expect(inlineToString(richText)).toBe("See docs")
	})
})

describe("content structure validation", () => {
	it.each(allSlugs)("page '%s' sections are valid", (slug) => {
		const content = contentBySlug[slug]
		for (const section of content.sections) {
			// Sections may be empty (e.g., subsection headers)
			expect(Array.isArray(section.content)).toBe(true)
		}
	})

	it.each(allSlugs)("page '%s' has valid block types", (slug) => {
		const content = contentBySlug[slug]
		const validTypes = ["text", "code", "command", "list", "table", "interactive", "conversation", "qa"]

		for (const section of content.sections) {
			for (const block of section.content) {
				expect(validTypes).toContain(block.type)
			}
		}
	})

	it("all pages have unique titles", () => {
		const titles = allSlugs.map(slug => contentBySlug[slug].title)
		const uniqueTitles = new Set(titles)
		expect(uniqueTitles.size).toBe(titles.length)
	})
})

describe("specific page content", () => {
	it("getting-started page has Requirements section", () => {
		const content = contentBySlug["getting-started"]
		expect(content).toBeDefined()
		const sectionTitles = content.sections.map(s => s.title)
		expect(sectionTitles).toContain("Requirements")
	})

	it("recipe-format page has Required Variables section", () => {
		const content = contentBySlug["recipe-format"]
		expect(content).toBeDefined()
		const sectionTitles = content.sections.map(s => s.title)
		expect(sectionTitles).toContain("Required Variables")
	})

	it("installation page has Overview section", () => {
		const content = contentBySlug["installation"]
		expect(content).toBeDefined()
		const sectionTitles = content.sections.map(s => s.title)
		expect(sectionTitles).toContain("Overview")
	})

	it("cli-reference page has content blocks", () => {
		const content = contentBySlug["cli-reference"]
		expect(content).toBeDefined()

		// Should have some content blocks (any type)
		let totalBlocks = 0
		for (const section of content.sections) {
			totalBlocks += section.content.length
		}
		expect(totalBlocks).toBeGreaterThan(0)
	})
})

describe("rendering consistency", () => {
	it("renders same content consistently", () => {
		const content = contentBySlug["getting-started"]
		const lines1 = renderPageToString(content)
		const lines2 = renderPageToString(content)
		expect(lines1).toEqual(lines2)
	})

	it("respects width parameter", () => {
		const content = contentBySlug["getting-started"]
		const narrow = renderPageToString(content, 40)
		const wide = renderPageToString(content, 80)

		// Title separators should be different widths
		expect(narrow[0].length).toBe(40)
		expect(wide[0].length).toBe(80)
	})
})
