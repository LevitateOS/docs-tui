import type { DocsSyntaxLanguage } from "@levitate/docs-content";
import type { ColorIntent } from "@levitate/tui-kit";

export type AstInlineNode =
	| { type: "text"; text: string }
	| { type: "strong"; text: string }
	| { type: "emphasis"; text: string }
	| { type: "code"; text: string }
	| { type: "link"; text: string; href: string };

export type AstListItemNode = {
	content: AstInlineNode[];
	children: AstInlineNode[][];
};

export type AstConversationMessageNode = {
	role: "user" | "ai";
	text: AstInlineNode[];
	list: AstInlineNode[][];
};

export type AstInteractiveStepNode = {
	command: string;
	description: AstInlineNode[];
};

export type AstQANode = {
	question: AstInlineNode[];
	answer: AstBlockNode[];
};

export type AstBlockNode =
	| { type: "paragraph"; content: AstInlineNode[] }
	| {
			type: "code";
			language: DocsSyntaxLanguage;
			filename?: string;
			lines: string[];
	  }
	| {
			type: "table";
			headers: AstInlineNode[][];
			rows: AstInlineNode[][][];
	  }
	| {
			type: "list";
			ordered: boolean;
			items: AstListItemNode[];
	  }
	| {
			type: "conversation";
			messages: AstConversationMessageNode[];
	  }
	| {
			type: "interactive";
			intro?: AstInlineNode[];
			steps: AstInteractiveStepNode[];
	  }
	| {
			type: "command";
			language: DocsSyntaxLanguage;
			description: AstInlineNode[];
			commandLines: string[];
			outputLines: string[];
	  }
	| {
			type: "qa";
			items: AstQANode[];
	  }
	| {
			type: "note";
			variant: "info" | "warning" | "danger";
			content: AstInlineNode[];
	  };

export type AstSectionNode = {
	title: AstInlineNode[];
	level: 2 | 3;
	blocks: AstBlockNode[];
};

export type AstDocumentNode = {
	title: AstInlineNode[];
	slug: string;
	intro?: AstInlineNode[];
	sections: AstSectionNode[];
};

export type StyledRun = {
	text: string;
	intent?: ColorIntent;
	backgroundIntent?: ColorIntent;
	literalColor?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
};

export type StyledRowKind =
	| "meta"
	| "heading"
	| "paragraph"
	| "code"
	| "command"
	| "table"
	| "note"
	| "qa"
	| "conversation"
	| "interactive"
	| "spacer";

export type StyledRow = {
	kind: StyledRowKind;
	runs: StyledRun[];
};
