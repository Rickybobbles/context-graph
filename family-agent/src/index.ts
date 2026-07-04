import Anthropic from "@anthropic-ai/sdk";
import { Bot } from "grammy";
import { config } from "./config.js";
import { audit } from "./db.js";
import { route } from "./router.js";
import { runAgent, type Tier } from "./agent.js";

const client = new Anthropic({ apiKey: config.anthropicKey });
const bot = new Bot(config.telegramToken);

// Auth: only allowlisted family members get through.
bot.use(async (ctx, next) => {
  const id = ctx.from?.id;
  if (!id || !config.family.has(id)) {
    if (ctx.from) audit(String(id), "rejected_unknown_sender");
    return; // silently ignore strangers
  }
  await next();
});

bot.command("start", (ctx) =>
  ctx.reply(
    `Hi ${config.family.get(ctx.from!.id)}! I'm the family assistant. ` +
      `Tell me things like "remind Rich to buy milk" or "what's on the task list?".`,
  ),
);

bot.on("message:text", async (ctx) => {
  const actor = config.family.get(ctx.from.id)!;
  const text = ctx.message.text;

  try {
    // Tier 1: cheap router classifies every message.
    const decision = await route(client, text);

    // Confidence gate: simple + confident → Haiku executes; anything else → planner tier.
    const tier: Tier =
      decision.complexity === "simple" && decision.confidence >= config.escalationThreshold
        ? "simple"
        : "planner";

    audit(
      actor,
      "route",
      `${decision.intent}/${decision.complexity}@${decision.confidence.toFixed(2)} -> ${tier}`,
    );

    const reply = await runAgent(client, tier, actor, text);
    await ctx.reply(reply);
  } catch (err) {
    console.error(err);
    await ctx.reply("Sorry, something went wrong on my end — try that again in a moment.");
  }
});

bot.catch((err) => console.error("bot error:", err.error));

console.log("family-agent starting (long polling)…");
void bot.start();
