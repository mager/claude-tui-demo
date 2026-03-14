import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";

// Keep session alive across turns so Claude remembers context
let sessionId: string | undefined;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function runTurn(userPrompt: string) {
  for await (const msg of query({
    prompt: userPrompt,
    options: {
      allowedTools: ["Read", "Glob", "Grep", "Bash"],
      resume: sessionId,
    },
  })) {
    if (msg.type === "system" && msg.subtype === "init") {
      sessionId = msg.session_id;
    }
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "text") process.stdout.write(`\n🤖 ${block.text}\n`);
        if (block.type === "tool_use") {
          process.stdout.write(`⚙  ${block.name}(${JSON.stringify(block.input).slice(0, 80)})\n`);
        }
      }
    }
  }
}

console.log("◆ Claude REPL — type your prompt, ctrl+c to quit\n");

// Forever loop — keeps prompting until you exit
while (true) {
  const input = await ask("\n> ");
  if (!input.trim()) continue;
  await runTurn(input.trim());
}
