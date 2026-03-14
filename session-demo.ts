import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;

function printMessage(msg: any) {
  if (msg.type === "system" && msg.subtype === "init") {
    sessionId = msg.session_id;
    console.log(`\n🔑 session: ${sessionId}\n`);
  }
  if (msg.type === "assistant") {
    for (const block of msg.message.content) {
      if (block.type === "text") console.log(`🤖 ${block.text}`);
      if (block.type === "tool_use") {
        console.log(`⚙  ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);
      }
    }
  }
  if (msg.type === "result") {
    console.log(`\n✓ done\n`);
  }
}

// Turn 1 — give Claude some context
console.log("=== Turn 1: Read the project ===");
for await (const msg of query({
  prompt: "Read package.json and summarize what this project does in one sentence.",
  options: { allowedTools: ["Read"] },
})) {
  printMessage(msg);
}

// Turn 2 — Claude still has full context from Turn 1
console.log("=== Turn 2: Follow-up (same session) ===");
for await (const msg of query({
  prompt: "Now list the dependencies you just saw.",
  options: {
    allowedTools: ["Read"],
    resume: sessionId,
  },
})) {
  printMessage(msg);
}
