export function installDocsCliHelpText(): string {
	return `
LevitateOS Docs TUI

Usage:
  levitate-install-docs
  levitate-install-docs --slug <page-slug>
  levitate-install-docs --slug=<page-slug>
  levitate-install-docs --help

Navigation:
  q / Esc / Ctrl-C  Quit
  h / l             Previous / next page
  [ / ]             Previous / next section
  j / k             Scroll page
  PgUp / PgDn       Fast scroll
  Tab               Toggle sidebar mode
  g / G             Top / bottom

Legacy non-interactive flags (--list, --page, --all) were removed.
`;
}
