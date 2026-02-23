import type {
	CodeBlock,
	CommandBlock,
	ContentBlock,
	ConversationBlock,
	InteractiveBlock,
	ListBlock,
	NoteBlock,
	QABlock,
	RichText,
	TableBlock,
	TextBlock,
} from "@levitate/docs-content";
import type { DocsContentLike } from "../../domain/content/contracts";
import type {
	AstBlockNode,
	AstDocumentNode,
	AstInlineNode,
	AstSectionNode,
} from "../../domain/render-ast/types";

function syntaxRenderError(blockType: "code" | "command", detail: string): never {
	throw new Error(
		`docs.render ${blockType} block: ${detail}. Remediation: run 'bun run build' in docs/content to regenerate syntax snapshots.`,
	);
}

function inlineFromString(text: string): AstInlineNode[] {
	return text.length > 0 ? [{ type: "text", text }] : [];
}

function toInlineNodes(value: string | RichText | undefined): AstInlineNode[] {
	if (typeof value === "string") {
		return inlineFromString(value);
	}
	if (!Array.isArray(value)) {
		return [];
	}

	const nodes: AstInlineNode[] = [];
	for (const part of value) {
		if (typeof part === "string") {
			if (part.length > 0) {
				nodes.push({ type: "text", text: part });
			}
			continue;
		}
		if (typeof part !== "object" || part === null || typeof part.type !== "string") {
			continue;
		}
		if (part.type === "bold") {
			nodes.push({ type: "strong", text: part.text });
			continue;
		}
		if (part.type === "italic") {
			nodes.push({ type: "emphasis", text: part.text });
			continue;
		}
		if (part.type === "code") {
			nodes.push({ type: "code", text: part.text });
			continue;
		}
		if (part.type === "link") {
			nodes.push({ type: "link", text: part.text, href: part.href });
			continue;
		}
	}

	return nodes;
}

function validateCodeBlock(block: CodeBlock): void {
	if (typeof block.language !== "string" || block.language.trim().length === 0) {
		syntaxRenderError("code", "missing required language");
	}
	if (!Array.isArray(block.highlightedLines)) {
		syntaxRenderError("code", "missing highlightedLines snapshot payload");
	}
	if (!block.highlightedLines.every((line) => typeof line === "string")) {
		syntaxRenderError("code", "highlightedLines contains non-string entries");
	}
}

function validateCommandBlock(block: CommandBlock): void {
	if (typeof block.language !== "string" || block.language.trim().length === 0) {
		syntaxRenderError("command", "missing required language");
	}
	if (!Array.isArray(block.highlightedCommandLines)) {
		syntaxRenderError("command", "missing highlightedCommandLines snapshot payload");
	}
	if (!block.highlightedCommandLines.every((line) => typeof line === "string")) {
		syntaxRenderError("command", "highlightedCommandLines contains non-string entries");
	}
}

function codeLines(block: CodeBlock): string[] {
	validateCodeBlock(block);
	return block.highlightedLines ?? [];
}

function commandLines(block: CommandBlock): string[] {
	validateCommandBlock(block);
	return block.highlightedCommandLines ?? [];
}

function toTableNode(block: TableBlock): AstBlockNode {
	return {
		type: "table",
		headers: block.headers.map((cell) =>
			toInlineNodes(typeof cell === "string" ? cell : (cell as RichText)),
		),
		rows: block.rows.map((row) =>
			row.map((cell) => toInlineNodes(typeof cell === "string" ? cell : (cell as RichText))),
		),
	};
}

function toListNode(block: ListBlock): AstBlockNode {
	return {
		type: "list",
		ordered: Boolean(block.ordered),
		items: block.items.map((item) => {
			if (typeof item === "string" || Array.isArray(item)) {
				return {
					content: toInlineNodes(item as string | RichText),
					children: [],
				};
			}
			return {
				content: toInlineNodes(item.text as string | RichText),
				children: Array.isArray(item.children)
					? item.children.map((child) => toInlineNodes(child as string | RichText))
					: [],
			};
		}),
	};
}

function toConversationNode(block: ConversationBlock): AstBlockNode {
	return {
		type: "conversation",
		messages: block.messages.map((message) => ({
			role: message.role,
			text: toInlineNodes(message.text as string | RichText),
			list: Array.isArray(message.list)
				? message.list.map((item) => toInlineNodes(item as string | RichText))
				: [],
		})),
	};
}

function toInteractiveNode(block: InteractiveBlock): AstBlockNode {
	return {
		type: "interactive",
		intro: block.intro ? toInlineNodes(block.intro as string | RichText) : undefined,
		steps: block.steps.map((step) => ({
			command: step.command,
			description: toInlineNodes(step.description as string | RichText),
		})),
	};
}

function toCommandNode(block: CommandBlock): AstBlockNode {
	return {
		type: "command",
		language: block.language,
		description: toInlineNodes(block.description),
		commandLines: commandLines(block),
		outputLines:
			typeof block.output === "string" && block.output.length > 0 ? block.output.split("\n") : [],
	};
}

function toQANode(block: QABlock): AstBlockNode {
	return {
		type: "qa",
		items: block.items.map((item) => ({
			question: toInlineNodes(item.question as string | RichText),
			answer: Array.isArray(item.answer) ? item.answer.map((answer) => toBlockNode(answer)) : [],
		})),
	};
}

function toNoteNode(block: NoteBlock): AstBlockNode {
	return {
		type: "note",
		variant: block.variant,
		content: toInlineNodes(block.content as string | RichText),
	};
}

function toTextNode(block: TextBlock): AstBlockNode {
	return {
		type: "paragraph",
		content: toInlineNodes(block.content as string | RichText),
	};
}

function toCodeNode(block: CodeBlock): AstBlockNode {
	return {
		type: "code",
		language: block.language,
		filename: block.filename,
		lines: codeLines(block),
	};
}

function toBlockNode(block: ContentBlock): AstBlockNode {
	switch (block.type) {
		case "text":
			return toTextNode(block);
		case "code":
			return toCodeNode(block);
		case "table":
			return toTableNode(block);
		case "list":
			return toListNode(block);
		case "conversation":
			return toConversationNode(block);
		case "interactive":
			return toInteractiveNode(block);
		case "command":
			return toCommandNode(block);
		case "qa":
			return toQANode(block);
		case "note":
			return toNoteNode(block);
		default:
			return { type: "paragraph", content: [] };
	}
}

function toSectionNode(section: DocsContentLike["sections"][number]): AstSectionNode {
	return {
		title: toInlineNodes(section.title),
		level: section.level ?? 2,
		blocks: section.content.map((block) => toBlockNode(block)),
	};
}

export function buildDocumentAst(content: DocsContentLike, slug: string): AstDocumentNode {
	return {
		title: toInlineNodes(content.title),
		slug,
		intro: content.intro ? toInlineNodes(content.intro as string | RichText) : undefined,
		sections: content.sections.map((section) => toSectionNode(section)),
	};
}

export function inlineNodesToPlain(nodes: ReadonlyArray<AstInlineNode>): string {
	return nodes
		.map((node) => {
			if (node.type === "link") {
				return `${node.text} (${node.href})`;
			}
			return node.text;
		})
		.join("");
}
