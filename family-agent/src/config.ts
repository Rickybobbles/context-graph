import { z } from "zod";

const Env = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  ANTHROPIC_API_KEY: z.string().min(10),
  // Comma-separated "telegramUserId:Name" pairs, e.g. "12345678:Rich,87654321:Anna"
  FAMILY_MEMBERS: z.string().min(1),
  DB_PATH: z.string().default("./data/family.db"),
  ROUTER_MODEL: z.string().default("claude-haiku-4-5"),
  SIMPLE_MODEL: z.string().default("claude-haiku-4-5"),
  PLANNER_MODEL: z.string().default("claude-sonnet-5"),
  // Router confidence below this escalates simple requests to the planner tier
  ESCALATION_THRESHOLD: z.coerce.number().default(0.8),
});

const env = Env.parse(process.env);

export const config = {
  telegramToken: env.TELEGRAM_BOT_TOKEN,
  anthropicKey: env.ANTHROPIC_API_KEY,
  dbPath: env.DB_PATH,
  models: {
    router: env.ROUTER_MODEL,
    simple: env.SIMPLE_MODEL,
    planner: env.PLANNER_MODEL,
  },
  escalationThreshold: env.ESCALATION_THRESHOLD,
  family: new Map(
    env.FAMILY_MEMBERS.split(",").map((pair) => {
      const [id, name] = pair.split(":");
      if (!id || !name) throw new Error(`Bad FAMILY_MEMBERS entry: "${pair}"`);
      return [Number(id.trim()), name.trim()] as const;
    }),
  ),
};
