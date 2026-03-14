import { query, Message } from "@anthropic-ai/claude-agent-sdk";

export async function* runAgent(prompt: string) {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Read", "Glob", "Grep", "Bash"],
    },
  })) {
    yield message;
  }
}
