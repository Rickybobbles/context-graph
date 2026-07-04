# family-agent

A shared personal assistant for the family, reached through Telegram. It keeps the
shared calendar current, turns chat into clear owned tasks, manages the payment
calendar and budget, and (with explicit approval) prepares orders from Migros Online
and Galaxus.

Full design: [docs/PLAN.md](docs/PLAN.md). This repo currently implements **Phase 0**:
the bot skeleton, tiered model routing (Haiku router → Haiku/Sonnet execution with a
confidence gate), and the shared task list in SQLite.

## Setup

1. **Create the bot** — message [@BotFather](https://t.me/BotFather) on Telegram,
   `/newbot`, pick a name; copy the token.
2. **Get family user ids** — each family member messages
   [@userinfobot](https://t.me/userinfobot) once and notes their numeric id.
3. **Configure** —
   ```sh
   cp .env.example .env   # fill in token, Anthropic API key, FAMILY_MEMBERS
   ```
4. **Run** —
   ```sh
   npm install
   npm run dev            # long polling — works anywhere, no domain/TLS needed
   ```
5. Message the bot (or add it to the family group and disable its privacy mode via
   BotFather if you want it reading group messages).

## How routing works

Every message is classified by Haiku (`ROUTER_MODEL`) into intent/complexity with a
confidence score. Simple + confident requests are executed directly by the cheap tier;
everything else escalates to the planner tier (`PLANNER_MODEL`). Thresholds and model
ids are env-tunable. All routing decisions and side-effecting tool calls land in the
`audit_log` table.

## Deploying

Any small always-on box works (Hetzner CX22, Fly.io machine, Raspberry Pi). Long
polling means no inbound ports are needed. Example systemd unit:

```ini
[Unit]
Description=family-agent
After=network-online.target

[Service]
WorkingDirectory=/opt/family-agent
ExecStart=/usr/bin/npm run start
EnvironmentFile=/opt/family-agent/.env
Restart=always

[Install]
WantedBy=multi-user.target
```

## Roadmap

- **Phase 1**: Google Calendar tools, context-triggered reminders (calendar × tasks),
  memory files, per-tier budget caps.
- **Phase 2**: bills register, statement-PDF ingestion (Batch API), weekly digest.
- **Phase 3**: shopping list → Migros/Galaxus deep links with approval buttons.

See [docs/PLAN.md](docs/PLAN.md) for the full plan, cost model, and security design.
