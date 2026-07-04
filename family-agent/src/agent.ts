import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { taskTools } from "./tools/tasks.js";

export type Tier = "simple" | "planner";

const SYSTEM = `You are the family's shared personal assistant, reached via Telegram.

Family members: ${[...config.family.values()].join(", ")}.

You manage a shared task list today; calendar, bills, and shopping are coming later —
if asked about those, say so briefly and capture anything actionable as a task instead.

Style: reply like a competent human PA in a group chat — short, warm, no headers or
markdown tables. Confirm actions in one line. When a request is ambiguous (no owner,
no date), make the sensible choice and note it rather than asking, unless the choice
really matters.`;

/**
 * Run one agent turn on the given tier. The SDK tool runner drives the
 * tool-call loop; tools are bound to the acting family member for auditing.
 */
export async function runAgent(
  client: Anthropic,
  tier: Tier,
  actor: string,
  text: string,
): Promise<string> {
  const model = tier === "planner" ? config.models.planner : config.models.simple;

  const finalMessage = await client.beta.messages.toolRunner({
    model,
    max_tokens: 4096,
    system: SYSTEM,
    tools: taskTools(actor),
    // effort is supported on the Sonnet/Opus tiers but errors on Haiku 4.5
    ...(tier === "planner" ? { output_config: { effort: "medium" as const } } : {}),
    messages: [{ role: "user", content: `${actor}: ${text}` }],
  });

  const reply = finalMessage.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return reply || "Done.";
}
