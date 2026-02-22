import { createTheme, type TuiTheme } from "@levitate/tui-kit";

export function createDocsTuiTheme(): TuiTheme {
  return createTheme(
    {
      border: {
        truecolor: "#3f4a5a",
        ansi256: 240,
        ansi16: "gray",
        mono: "normal",
      },
      text: {
        truecolor: "#e6edf3",
        ansi256: 255,
        ansi16: "white",
        mono: "normal",
      },
      dimText: {
        truecolor: "#9aa4b2",
        ansi256: 248,
        ansi16: "gray",
        mono: "normal",
      },
      accent: {
        truecolor: "#5eead4",
        ansi256: 80,
        ansi16: "cyan",
        mono: "bold",
      },
      info: {
        truecolor: "#7aa2f7",
        ansi256: 111,
        ansi16: "blue",
        mono: "bold",
      },
      warning: {
        truecolor: "#f5c16c",
        ansi256: 221,
        ansi16: "yellow",
        mono: "bold",
      },
      error: {
        truecolor: "#ff7b72",
        ansi256: 203,
        ansi16: "red",
        mono: "bold",
      },
      success: {
        truecolor: "#7ee787",
        ansi256: 114,
        ansi16: "green",
        mono: "bold",
      },
      background: {
        truecolor: "#111827",
        ansi256: 235,
        ansi16: "black",
        mono: "normal",
      },
    },
    {
      sidebarWidth: 34,
      minColumns: 90,
    },
  );
}
