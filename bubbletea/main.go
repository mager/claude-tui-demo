package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

var (
	styleHeader = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("86"))
	styleUser   = lipgloss.NewStyle().Foreground(lipgloss.Color("86"))
	styleTool   = lipgloss.NewStyle().Foreground(lipgloss.Color("220"))
	styleAgent  = lipgloss.NewStyle().Foreground(lipgloss.Color("255"))
	styleResult = lipgloss.NewStyle().Foreground(lipgloss.Color("82"))
	styleWait   = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
)

// ---------------------------------------------------------------------------
// Messages (Bubble Tea msg types, not Claude messages)
// ---------------------------------------------------------------------------

type lineMsg struct{ kind, text string }
type doneMsg struct{}
type errMsg struct{ err error }

// ---------------------------------------------------------------------------
// Model (Elm Architecture: all state lives here)
// ---------------------------------------------------------------------------

type model struct {
	lines  []lineMsg
	done   bool
	prompt string
	err    error
}

func initialModel(prompt string) model {
	return model{
		prompt: prompt,
		lines:  []lineMsg{{kind: "user", text: "> " + prompt}},
	}
}

// ---------------------------------------------------------------------------
// Init — kick off the agent stream as a Bubble Tea command
// ---------------------------------------------------------------------------

func (m model) Init() (tea.Model, tea.Cmd) {
	return m, runAgent(m.prompt)
}

// runAgent returns a tea.Cmd that streams Claude's output as tea.Msg events.
func runAgent(prompt string) tea.Cmd {
	return func() tea.Msg {
		// We return a batch of commands — one per streamed message — but since
		// Bubble Tea is sequential, we collect all lines and send them in order.
		// For a true streaming experience, wire this via a channel + tea.Listen.
		client := anthropic.NewClient() // reads ANTHROPIC_API_KEY from env

		stream := client.Messages.NewStreaming(context.Background(), anthropic.MessageNewParams{
			Model:     anthropic.ModelClaude3_5SonnetLatest,
			MaxTokens: 1024,
			Messages: []anthropic.MessageParam{
				anthropic.NewUserMessage(anthropic.NewTextBlock(prompt)),
			},
		})

		var lines []lineMsg
		for stream.Next() {
			event := stream.Current()
			switch e := event.AsUnion().(type) {
			case anthropic.ContentBlockDeltaEvent:
				if delta, ok := e.Delta.AsUnion().(anthropic.TextDelta); ok {
					lines = append(lines, lineMsg{kind: "agent", text: delta.Text})
				}
			}
		}
		if err := stream.Err(); err != nil {
			return errMsg{err: err}
		}
		lines = append(lines, lineMsg{kind: "result", text: "✓ done"})
		// Return a batch so each line triggers an Update call
		cmds := make([]tea.Cmd, len(lines))
		for i, l := range lines {
			l := l
			cmds[i] = func() tea.Msg { return l }
		}
		return tea.Batch(cmds...)()
	}
}

// ---------------------------------------------------------------------------
// Update — pure function: (model, msg) → (model, cmd)
// ---------------------------------------------------------------------------

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if msg.String() == "ctrl+c" || msg.String() == "esc" {
			return m, tea.Quit
		}
	case lineMsg:
		m.lines = append(m.lines, msg)
		if msg.kind == "result" {
			m.done = true
			return m, tea.Quit
		}
	case errMsg:
		m.err = msg.err
		m.done = true
		return m, tea.Quit
	}
	return m, nil
}

// ---------------------------------------------------------------------------
// View — pure function: model → string
// ---------------------------------------------------------------------------

func (m model) View() string {
	var sb strings.Builder

	sb.WriteString(styleHeader.Render("◆ My AI Terminal (Bubble Tea)"))
	sb.WriteString(styleWait.Render("  esc to quit"))
	sb.WriteString("\n\n")

	for _, line := range m.lines {
		switch line.kind {
		case "user":
			sb.WriteString(styleUser.Render(line.text))
		case "tool":
			sb.WriteString(styleTool.Render("⚙ " + line.text))
		case "agent":
			sb.WriteString(styleAgent.Render(line.text))
		case "result":
			sb.WriteString(styleResult.Render(line.text))
		}
		sb.WriteString("\n")
	}

	if !m.done {
		sb.WriteString(styleWait.Render("▸ thinking..."))
	}
	if m.err != nil {
		sb.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Render("error: " + m.err.Error()))
	}

	return sb.String()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func main() {
	prompt := strings.Join(os.Args[1:], " ")
	if prompt == "" {
		prompt = "What files are in this directory?"
	}

	p := tea.NewProgram(initialModel(prompt))
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
