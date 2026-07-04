import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { config } from "./config.js";

const Route = z.object({
  intent: z.enum(["task", "calendar", "shopping", "money", "question", "chat"]),
  complexity: z.enum(["simple", "multi_step", "analysis"]),
  confidence: z.number().describe("0 to 1: how sure you are this classification is right"),
});

export type Route = z.infer<typeof Route>;

const ROUTER_PROMPT = `You classify one incoming message to a family assistant bot.

- intent: what the message is about.
- complexity:
  - "simple": one obvious action (add/list/complete a task, a factual lookup).
  - "multi_step": needs several actions or tools, or references multiple people/dates.
  - "analysis": open-ended reasoning (budgets, planning, comparisons).
- confidence: your certainty in this classification. Be honest; ambiguous or garbled
  messages should score low so a stronger model handles them.`;

export async function route(client: Anthropic, text: string): Promise<Route> {
  const response = await client.messages.parse({
    model: config.models.router,
    max_tokens: 256,
    system: ROUTER_PROMPT,
    messages: [{ role: "user", content: text }],
    output_config: { format: zodOutputFormat(Route) },
  });
  if (!response.parsed_output) {
    // Unparseable classification — treat as low confidence so the planner tier takes it.
    return { intent: "chat", complexity: "multi_step", confidence: 0 };
  }
  return response.parsed_output;
}
