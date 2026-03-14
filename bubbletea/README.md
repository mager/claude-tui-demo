# Bubble Tea variant

This is the Go version of the claude-tui-demo, using [Bubble Tea](https://github.com/charmbracelet/bubbletea) instead of Ink.

Same concept — stream Claude's output to a terminal UI — but Go's Elm Architecture instead of React hooks.

## Run

```bash
cd bubbletea
go mod tidy
export ANTHROPIC_API_KEY=your-key
go run main.go "What files are in this directory?"
```

## Architecture

Bubble Tea uses the **Elm Architecture** — three pure functions:

- `Init()` — returns initial model + a command (kicks off the agent stream)
- `Update(msg)` — handles incoming messages, returns new model + next command  
- `View()` — renders current model to a string

All state lives in `model`. No side effects in View. No global state. Very testable.

Compare to the Ink version in `../App.tsx` — same streaming pattern, different mental model.
