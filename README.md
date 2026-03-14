# claude-tui-demo

Demo repo for the blog post: **[Claude Agent SDK: Build Your Own AI Terminal in 10 Minutes](https://www.mager.co/blog/2026-03-14-claude-agent-sdk-tui/)**

## What's inside

| Directory / File | What it does |
|---|---|
| `index.tsx` | Single-prompt TUI with [Ink](https://github.com/vadimdemedes/ink) (React-style) |
| `repl.ts` | REPL / multi-turn mode with persistent sessions |
| `session-demo.ts` | Persistent session demo — Turn 2 fires zero tool calls |
| `agent.ts` | Shared agent + hooks setup |
| `rezi/` | Same TUI rebuilt with [Rezi](https://rezitui.dev) (state-driven, native rendering) |

## Quick start

```bash
git clone https://github.com/mager/claude-tui-demo.git
cd claude-tui-demo
npm install
export ANTHROPIC_API_KEY=your-key

# Single-prompt TUI (Ink)
npm start "What files are in this directory?"

# REPL mode
npm run repl

# Session continuity demo
npm run session
```

## Rezi variant

```bash
cd rezi
npm install
export ANTHROPIC_API_KEY=your-key
npm start "What files are in this directory?"
```

## Requirements

- Node.js 18+
- Anthropic API key with credits ([top up here](https://platform.claude.com/settings/billing))
