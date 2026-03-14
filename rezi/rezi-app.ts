// rezi-app.ts — Claude Agent SDK + Rezi TUI
import { ui } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { query } from "@anthropic-ai/claude-agent-sdk";

// --- Types ---
type LineKind = "user" | "agent" | "tool" | "result";
type LogLine = { kind: LineKind; text: string };
type State = { lines: LogLine[]; done: boolean };

// --- App ---
const prompt = process.argv.slice(2).join(" ") || "What files are in this directory?";

const app = createNodeApp<State>({
  initialState: { lines: [{ kind: "user", text: `> ${prompt}` }], done: false },
});

// --- View ---
const kindVariant: Record<LineKind, string> = {
  user: "info",
  agent: "body",
  tool: "warning",
  result: "success",
};

app.view((state) =>
  ui.page({
    p: 1,
    gap: 1,
    header: ui.header({
      title: "◆ My AI Terminal",
      subtitle: "esc / q to quit",
    }),
    body: ui.panel(
      "Output",
      [
        ...state.lines.map((line, i) =>
          ui.text(line.text, { key: String(i), variant: kindVariant[line.kind] as any })
        ),
        ...(!state.done
          ? [ui.spinner({ label: "thinking…", key: "spinner" })]
          : []),
      ]
    ),
  })
);

app.keys({ q: () => app.stop(), escape: () => app.stop() });

// --- Agent stream ---
async function runAgent() {
  for await (const msg of query({
    prompt,
    options: { allowedTools: ["Read", "Glob", "Grep", "Bash"] },
  })) {
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "text") {
          app.update((s) => ({
            ...s,
            lines: [...s.lines, { kind: "agent", text: block.text }],
          }));
        }
        if (block.type === "tool_use") {
          const preview = JSON.stringify(block.input).slice(0, 60);
          app.update((s) => ({
            ...s,
            lines: [...s.lines, { kind: "tool", text: `⚙ ${block.name}(${preview})` }],
          }));
        }
      }
    }
    if (msg.type === "result") {
      app.update((s) => ({
        ...s,
        lines: [...s.lines, { kind: "result", text: `✓ ${msg.result}` }],
        done: true,
      }));
    }
  }
}

runAgent().catch((err) => {
  app.update((s) => ({
    ...s,
    lines: [...s.lines, { kind: "result", text: `✗ ${err.message}` }],
    done: true,
  }));
});

await app.start();
