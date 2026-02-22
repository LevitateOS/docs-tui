import { createTheme, type TuiTheme } from "@levitate/tui-kit";

export function createDocsTuiTheme(): TuiTheme {
  return createTheme({}, { sidebarWidth: 34, minColumns: 90 });
}
