import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { runAgent } from "./agent.js";

type LogLine = { type: "user" | "agent" | "tool" | "result"; text: string };

export function App({ prompt }: { prompt: string }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);
  const { exit } = useApp();

  useEffect(() => {
    setLines([{ type: "user", text: `> ${prompt}` }]);

    (async () => {
      for await (const msg of runAgent(prompt)) {
        if (msg.type === "assistant") {
          // Text response from Claude
          for (const block of msg.message.content) {
            if (block.type === "text") {
              setLines((prev) => [...prev, { type: "agent", text: block.text }]);
            }
            if (block.type === "tool_use") {
              setLines((prev) => [
                ...prev,
                { type: "tool", text: `⚙ ${block.name}(${JSON.stringify(block.input).slice(0, 60)})` },
              ]);
            }
          }
        }
        if (msg.type === "result") {
          setLines((prev) => [...prev, { type: "result", text: `✓ ${msg.result}` }]);
          setDone(true);
        }
      }
    })();
  }, []);

  useInput((_, key) => {
    if (key.escape || (key.ctrl && _.toLowerCase() === "c")) exit();
  });

  const colors: Record<LogLine["type"], string> = {
    user: "cyan",
    agent: "white",
    tool: "yellow",
    result: "green",
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ◆ My AI Terminal
        </Text>
        <Text color="gray">  (esc to quit)</Text>
      </Box>

      {lines.map((line, i) => (
        <Text key={i} color={colors[line.type]}>
          {line.text}
        </Text>
      ))}

      {!done && <Text color="gray">▸ thinking...</Text>}
    </Box>
  );
}
