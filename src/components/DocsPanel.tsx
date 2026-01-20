import React, { useState, useMemo } from "react"
import { Box, Text, useInput, useApp } from "ink"
import {
	docsNav,
	contentBySlug,
	type DocsContent,
	type ContentBlock,
	type RichText,
	type InlineNode,
	type Section,
	type QABlock,
	type QAItem,
} from "@levitate/docs-content"

// Flatten nav items for easy indexing
interface FlatNavItem {
	slug: string
	title: string
	sectionTitle: string
}

function flattenNav(): FlatNavItem[] {
	const items: FlatNavItem[] = []
	for (const section of docsNav) {
		for (const item of section.items) {
			// Extract slug from href (e.g., "/docs/getting-started" -> "getting-started")
			const slug = item.href.replace("/docs/", "")
			items.push({
				slug,
				title: item.title,
				sectionTitle: section.title,
			})
		}
	}
	return items
}

// Render inline rich text nodes
function renderInline(node: InlineNode): React.ReactNode {
	if (typeof node === "string") return node
	switch (node.type) {
		case "link":
			return <Text color="cyan" underline>{node.text}</Text>
		case "bold":
			return <Text bold>{node.text}</Text>
		case "code":
			return <Text color="yellow">{node.text}</Text>
		case "italic":
			return <Text italic>{node.text}</Text>
	}
}

function RichTextSpan({ content }: { content: string | RichText }): React.ReactElement {
	if (typeof content === "string") {
		return <Text>{content}</Text>
	}
	return (
		<Text>
			{content.map((node, i) => (
				<React.Fragment key={i}>{renderInline(node)}</React.Fragment>
			))}
		</Text>
	)
}

// Render a single content block
function ContentBlockView({ block }: { block: ContentBlock }): React.ReactElement {
	switch (block.type) {
		case "text":
			return (
				<Box marginBottom={1}>
					<RichTextSpan content={block.content} />
				</Box>
			)

		case "code":
			return (
				<Box flexDirection="column" marginBottom={1}>
					{block.filename && (
						<Text color="gray">{block.filename}</Text>
					)}
					<Box borderStyle="single" borderColor="gray" paddingX={1}>
						<Text color="green">{block.content}</Text>
					</Box>
				</Box>
			)

		case "command":
			return (
				<Box flexDirection="column" marginBottom={1}>
					<Text dimColor>{block.description}</Text>
					<Text color="cyan">
						$ {Array.isArray(block.command) ? block.command.join("\n$ ") : block.command}
					</Text>
					{block.output && <Text dimColor>{block.output}</Text>}
				</Box>
			)

		case "table":
			return (
				<Box flexDirection="column" marginBottom={1}>
					<Box>
						{block.headers.map((header, i) => (
							<Box key={i} width={20}>
								<Text bold>
									{typeof header === "string" ? header : ""}
								</Text>
							</Box>
						))}
					</Box>
					{block.rows.map((row, rowIdx) => (
						<Box key={rowIdx}>
							{row.map((cell, cellIdx) => (
								<Box key={cellIdx} width={20}>
									<Text color={cellIdx === block.monospaceCol ? "yellow" : undefined}>
										{typeof cell === "string" ? cell : ""}
									</Text>
								</Box>
							))}
						</Box>
					))}
				</Box>
			)

		case "list":
			return (
				<Box flexDirection="column" marginBottom={1}>
					{block.items.map((item, i) => {
						const text = typeof item === "string" || Array.isArray(item)
							? item
							: item.text
						const prefix = block.ordered ? `${i + 1}.` : "•"
						return (
							<Box key={i}>
								<Text>{prefix} </Text>
								<RichTextSpan content={text as string | RichText} />
							</Box>
						)
					})}
				</Box>
			)

		case "conversation":
			return (
				<Box flexDirection="column" marginBottom={1}>
					{block.messages.map((msg, i) => (
						<Box key={i} marginBottom={1}>
							<Text color={msg.role === "user" ? "blue" : "green"} bold>
								{msg.role === "user" ? "You: " : "AI: "}
							</Text>
							<RichTextSpan content={msg.text} />
						</Box>
					))}
				</Box>
			)

		case "interactive":
			return (
				<Box flexDirection="column" marginBottom={1}>
					{block.intro && (
						<Box marginBottom={1}>
							<RichTextSpan content={block.intro} />
						</Box>
					)}
					{block.steps.map((step, i) => (
						<Box key={i} marginBottom={1}>
							<Text color="cyan">$ {step.command}</Text>
							<Box marginLeft={2}>
								<RichTextSpan content={step.description} />
							</Box>
						</Box>
					))}
				</Box>
			)

		case "qa":
			return <QABlockView block={block} />

		default:
			return <Text dimColor>[Unknown block type]</Text>
	}
}

// Render QA block
function QABlockView({ block }: { block: QABlock }): React.ReactElement {
	return (
		<Box flexDirection="column" marginBottom={1}>
			{block.items.map((item: QAItem, i: number) => (
				<Box key={i} flexDirection="column" marginBottom={1}>
					<Box>
						<Text color="yellow" bold>Q: </Text>
						<RichTextSpan content={item.question} />
					</Box>
					<Box flexDirection="column" marginLeft={3}>
						{item.answer.map((answerBlock: ContentBlock, j: number) => (
							<ContentBlockView key={j} block={answerBlock} />
						))}
					</Box>
				</Box>
			))}
		</Box>
	)
}

// Render a section
function SectionView({ section }: { section: Section }): React.ReactElement {
	const levelPrefix = section.level === 3 ? "### " : "## "
	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold color="magenta">
				{levelPrefix}{section.title}
			</Text>
			{section.content.map((block, i) => (
				<ContentBlockView key={i} block={block} />
			))}
		</Box>
	)
}

// Main DocsPanel component
export function DocsPanel(): React.ReactElement {
	const { exit } = useApp()
	const navItems = useMemo(() => flattenNav(), [])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [scrollOffset, setScrollOffset] = useState(0)

	const currentItem = navItems[selectedIndex]
	const content: DocsContent | undefined = currentItem
		? contentBySlug[currentItem.slug]
		: undefined

	useInput((input, key) => {
		// Navigation
		if (key.upArrow) {
			setSelectedIndex((i) => Math.max(0, i - 1))
			setScrollOffset(0)
		} else if (key.downArrow) {
			setSelectedIndex((i) => Math.min(navItems.length - 1, i + 1))
			setScrollOffset(0)
		}

		// Content scrolling
		if (input === "j") {
			setScrollOffset((o) => o + 1)
		} else if (input === "k") {
			setScrollOffset((o) => Math.max(0, o - 1))
		}

		// Quit
		if (input === "q" || (key.ctrl && input === "c")) {
			exit()
		}
	})

	return (
		<Box flexDirection="row" height={process.stdout.rows - 2}>
			{/* Navigation sidebar */}
			<Box
				flexDirection="column"
				width={30}
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
			>
				<Text bold color="cyan">LevitateOS Docs</Text>
				<Text dimColor>↑↓ navigate • j/k scroll • q quit</Text>
				<Box marginTop={1} flexDirection="column">
					{docsNav.map((section) => (
						<Box key={section.title} flexDirection="column" marginBottom={1}>
							<Text bold dimColor>{section.title}</Text>
							{section.items.map((item) => {
								const slug = item.href.replace("/docs/", "")
								const isSelected = currentItem?.slug === slug
								return (
									<Box key={item.href} marginLeft={1}>
										<Text
											color={isSelected ? "cyan" : undefined}
											inverse={isSelected}
										>
											{item.title}
										</Text>
									</Box>
								)
							})}
						</Box>
					))}
				</Box>
			</Box>

			{/* Content panel */}
			<Box
				flexDirection="column"
				flexGrow={1}
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				overflow="hidden"
			>
				{content ? (
					<Box flexDirection="column">
						<Text bold color="cyan">{content.title}</Text>
						{content.intro && (
							<Box marginBottom={1}>
								<RichTextSpan content={content.intro} />
							</Box>
						)}
						{content.sections.slice(scrollOffset).map((section, i) => (
							<SectionView key={i} section={section} />
						))}
					</Box>
				) : (
					<Text dimColor>No content available</Text>
				)}
			</Box>
		</Box>
	)
}
