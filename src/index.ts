#!/usr/bin/env bun

import { startTUI } from "./tui-blessed";

const REMOVED_FLAGS = new Set(["--list", "-l", "--page", "-p", "--all", "-a", "--tmux-mode"]);

export type CliOptions = {
  help: boolean;
  slug?: string;
  error?: string;
};

export function docsCliHelpText(): string {
  return `
LevitateOS Docs TUI

Usage:
  levitate-docs
  levitate-docs --slug <page-slug>
  levitate-docs --slug=<page-slug>
  levitate-docs --help

Navigation:
  q / Esc / Ctrl-C  Quit
  h / l             Previous / next page
  j / k             Scroll page
  PgUp / PgDn       Fast scroll
  g / G             Top / bottom

Legacy non-interactive flags (--list, --page, --all) were removed.
`;
}

export function parseCliArgs(args: string[]): CliOptions {
  let slug: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const [flag] = arg.split("=", 1);

    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }

    if (REMOVED_FLAGS.has(flag)) {
      return {
        help: false,
        error:
          `Flag '${flag}' was removed. Run interactive mode with no flags or use '--slug <page-slug>'.`,
      };
    }

    if (arg.startsWith("--slug=")) {
      const inlineSlug = arg.slice("--slug=".length).trim();
      if (inlineSlug.length === 0) {
        return {
          help: false,
          error: "Flag '--slug' requires a non-empty page slug.",
        };
      }
      slug = inlineSlug;
      continue;
    }

    if (arg === "--slug" || arg === "-s") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        return {
          help: false,
          error: "Flag '--slug' requires a non-empty page slug.",
        };
      }
      slug = value;
      index += 1;
      continue;
    }

    return {
      help: false,
      error: `Unknown argument '${arg}'. Use '--help' for usage.`,
    };
  }

  return {
    help: false,
    slug,
  };
}

export function runCli(args: string[] = process.argv.slice(2)): void {
  const options = parseCliArgs(args);

  if (options.help) {
    console.log(docsCliHelpText());
    return;
  }

  if (options.error) {
    console.error(options.error);
    process.exit(2);
  }

  try {
    startTUI({ slug: options.slug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start docs TUI: ${message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  runCli();
}
