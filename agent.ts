import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

// Hook: log every tool use to audit.log
const auditHook = async (input: any) => {
  const tool = input.tool_name ?? "unknown";
  const toolInput = JSON.stringify(input.tool_input ?? {}).slice(0, 100);
  const line = `${new Date().toISOString()}  ${tool}  ${toolInput}\n`;
  await appendFile("./audit.log", line);
  return {};
};

export async function* runAgent(prompt: string) {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Read", "Glob", "Grep", "Bash"],
      hooks: {
        PostToolUse: [{ matcher: ".*", hooks: [auditHook] }],
      },
    },
  })) {
    yield message;
  }
}
