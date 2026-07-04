# Family Assistant Agent — Project Plan

A shared, always-on personal assistant for the family. Any family member talks to it like a PA;
it keeps the shared calendar current, turns conversations into clear tasks assigned to the right
person at the right moment ("Rich, grab milk on your way home from picking Remy up at nursery"),
manages the payment calendar and budget, and — with explicit approval — orders things from
Migros Online and Galaxus.

Personal project. Design goals: **cost-effective** (route to the cheapest capable model, escalate
only when needed), **safe** (nothing spends money without a human tap), **low-maintenance**
(one small service, boring infrastructure).

---

## 1. Capabilities

### MVP (Phase 1)
| Capability | What it does |
|---|---|
| **Conversational PA** | Telegram family group + per-person DMs with the assistant. Understands natural requests: "we're at Sarah's for dinner Saturday", "remind me to renew Remy's health insurance". |
| **Shared calendar** | Reads/writes the family Google Calendar. Detects conflicts ("that clashes with Remy's swim class"), adds travel-time buffers. |
| **Task list & jobs-to-be-done** | Extracts clear, atomic tasks from chat. Each task gets an owner, a due window, and optionally a *context trigger* (see below). |
| **Context-aware task routing** | The clever bit: tasks are matched against calendar movements. "Buy milk" + "Rich has nursery pickup at 17:00 near the Migros" → agent pings Rich at 16:50 with the errand attached. No live GPS needed for v1 — the calendar *is* the location model. |

### Phase 2 — Money
| Capability | What it does |
|---|---|
| **Payment calendar** | A recurring-bills register (rent, Krankenkasse, Serafe, insurance, subscriptions). Agent reminds before due dates, tracks paid/unpaid, flags anomalies ("electricity bill is 40% higher than usual"). |
| **Statement ingestion** | **Decided: bills come in as statement documents.** Drop a bank/card statement PDF into the chat → Claude's native PDF support extracts transactions → Haiku categorizes → SQLite. Recurring-bill detection seeds and maintains the payment calendar automatically. Runs via the Batch API (50% off) since it's not latency-sensitive. |
| **Budgeting** | Monthly envelope summaries per category; "can we afford X this month?" answers grounded in the register + spending log built from ingested statements. (YNAB sync stays optional/unneeded.) |
| **Savings goals** | "We're saving CHF 2,000 for summer holidays" → tracked, progress reported in the weekly digest. |

### Phase 3 — Purchasing
| Capability | What it does |
|---|---|
| **Shopping list → cart** | Agent maintains a running grocery list; on request, builds a Migros Online cart from it (item matching, substitutions proposed in chat). |
| **Approved checkout** | Agent **never** completes payment autonomously. It assembles the cart, posts a summary + total to the chat with an *Approve / Edit / Cancel* button; a human tap triggers checkout. Hard monthly spend cap and per-order cap enforced in code, not in the prompt. |
| **Galaxus purchases** | Same pattern for household/one-off items: agent researches options, presents 2–3 with prices, human picks, agent fills cart, human approves checkout. |

> **Reality check on Migros/Galaxus:** neither has a public purchasing API. The workable options are
> (a) **Playwright browser automation** against your logged-in account — build cart, stop at the
> payment page for human approval; or (b) **deep-link mode** — agent produces the exact product
> links and quantities, human clicks through in 30 seconds. Recommend shipping (b) in Phase 1
> (nearly free, zero fragility) and building (a) later. Scrapers/automation break when the site
> changes; treat it as best-effort convenience, never a critical path.

### Ideas backlog (Phase 4+)
- **Meal planning** → weekly menu → auto-populates the Migros list.
- **Inbox ingestion**: a dedicated family email address; agent parses nursery newsletters, e-bills,
  school schedules into calendar events and payment entries. (Untrusted input — see Security.)
- **Weekly family digest**: Sunday evening summary — week ahead, open tasks per person, money
  status, anything needing a decision. Cheap to run via the Batch API (50% off).
- **Chore rotation** with fairness tracking.
- **Document vault**: insurance policies, contracts, warranties with renewal reminders.
- **Gift & occasions tracker**: birthdays, what was given last year, ideas captured year-round.
- **Travel planning assistant**: packing lists keyed to who's going and the forecast.
- **Home Assistant hook** (if you run HA): real presence detection to sharpen task routing
  beyond calendar inference.

---

## 2. Architecture

Two candidate shapes. **Path A (Hermes harness) is the preferred direction**, pending a
weekend trial; **Path B (custom orchestrator) is the fallback** and is already scaffolded
and working, so nothing is at risk while we evaluate.

### Path A (preferred, pending trial): Hermes harness + family-tools MCP server

[Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research, MIT, self-hosted)
provides the entire harness layer off the shelf: Telegram/WhatsApp/Signal gateways, persistent
agent-curated memory with cross-session recall, a natural-language cron scheduler, MCP support,
sandboxed execution with command approval/allowlists, and a very large active community.

```
Telegram gateway ──► Hermes Agent (Docker on the VPS)
                        │  harness: chat, memory, cron,
                        │  agent loop, skills
                        ▼  MCP
             ┌─────────────────────────────┐
             │  family-tools MCP server    │   ← the code WE own
             │  (Node/TS, same box)        │
             │                             │
             │  • tasks / shopping / bills │
             │    (SQLite + audit log)     │
             │  • Google Calendar tools    │
             │  • statement ingestion      │
             │  • Migros/Galaxus deep links│
             │  • ask_approval + hard      │
             │    spend caps (server-side) │
             └─────────────────────────────┘
```

The split principle: **Hermes owns the plumbing, we own the domain and the money.**
Everything safety-critical (spend caps, merchant allowlist, approval gates) lives in the MCP
server's code, where the agent — including Hermes's self-authored skills — cannot rewrite it.

**Known trade-offs to validate in the trial:**

1. **No per-request tiered model routing.** Hermes runs one model at a time (`hermes model`
   switches globally). Running Sonnet full-time costs roughly $15–30/mo at family volume —
   more than the tiered design, still cheap. If Hermes later grows router support, we reclaim
   the savings.
2. **Multi-user family semantics unproven.** "DM pairing" suggests a single-owner design.
   The trial must confirm: several family members talking to one agent, with per-person
   identity reaching the MCP tools (for task ownership and purchase-approval roles).
3. **Self-improving skills + money don't mix.** Mitigated by the split above; also disable
   or review skill auto-authoring around purchase flows.
4. **Fast-moving young project** — expect breaking changes; pin versions, update deliberately.

**Trial (decision gate):** run Hermes in Docker with the Telegram gateway on Sonnet for a
weekend; two family members use it for real. Pass = multi-user works, per-person identity is
visible to tools, and it feels stable. Pass → Path A; fail → Path B, nothing lost.

### Path B (fallback, already scaffolded): thin TypeScript orchestrator

Phase 0 of this path is **built and smoke-tested** (`family-agent/` — Telegram bot, Haiku
router with confidence gate, task tools, SQLite, audit log).

```
Telegram (family group + per-person DMs)
        │  webhook
        ▼
┌─────────────────────────────────────────────┐
│  Orchestrator (Node/TS, single small VPS)   │
│                                             │
│  1. Auth: Telegram user-ID allowlist        │
│  2. Router: Haiku classifies the request    │
│  3. Dispatch:                               │
│     • deterministic path (no LLM) — button  │
│       taps, /commands, reminder firings     │
│     • Haiku + strict tools — simple CRUD    │
│     • Sonnet + full toolset — planning,     │
│       multi-step, ambiguous requests        │
│     • Opus — rare escalations only          │
│  4. Confidence gate → escalate or ask       │
│                                             │
│  SQLite: tasks, bills, budget, shopping     │
│  list, audit log, agent memory files        │
│  node-cron: reminders, digests, bill checks │
└──────┬──────────┬───────────┬───────────────┘
       ▼          ▼           ▼
  Google       Claude      Playwright worker
  Calendar API  API         (Migros/Galaxus,
  (shared cal)              approval-gated)
```

**Why this shape:**

- **Claude API + tool use (own loop)** rather than Managed Agents: you need per-request model
  choice for cost routing, and your tools (calendar, DB, Telegram buttons) are all client-side
  anyway. Managed Agents shines when you want Anthropic to host a container workspace — not needed
  here, and it adds cost. The SDK's beta **tool runner** (`client.beta.messages.toolRunner` with
  `betaZodTool`) handles the agentic loop for you; drop to the manual loop only for the purchase
  flow where you want a human-approval gate between tool call and execution.
- **Telegram (decided)** over WhatsApp and Slack:
  - **WhatsApp was the first choice but the Business API fights this use case**: no group chat
    for small accounts (Meta gates native groups to 100k+ monthly-conversation businesses),
    per-message fees for proactive reminders (~CHF 0.03–0.05 each), pre-approved template
    friction, a dedicated phone number, and Meta Business verification. All of that disappears
    with Telegram.
  - **Slack** was considered: good bots and buttons, but its free tier hides messages after
    90 days and the whole product is shaped for workplaces, not families.
  - **Telegram gives everything this agent needs for free**: a real family group chat *plus*
    per-person DMs, unlimited proactive messages (reminders cost nothing, any time), inline
    approval buttons for the checkout gate, file/PDF uploads for statement ingestion, and a
    2-minute bot setup via @BotFather. The only cost is the family installing one more app.
  - The chat layer stays a thin adapter regardless, so revisiting WhatsApp later (if Meta
    loosens the group/pricing constraints) is cheap.
- **One small VPS + SQLite** over serverless: the agent needs cron jobs, a persistent Playwright
  browser profile, and a long-lived event loop. A €4–5/mo Hetzner box (or Fly.io machine, or a
  Raspberry Pi at home for ~free) covers all of it. SQLite is plenty for one family; no managed
  DB to pay for.
- **Google Calendar as the calendar source of truth** — the family already gets native
  phone/watch UX for free; the agent is a *client* of the calendar, not a replacement.

### Alternatives considered
| Option | Verdict |
|---|---|
| Hermes Agent harness | **Promoted to Path A** (see above), pending the multi-user trial. |
| Managed Agents (Anthropic-hosted sessions) | Clean, but per-session containers + always-Opus-class defaults work against the cost goal. Revisit if the orchestrator grows painful. |
| Claude Agent SDK / Claude Code as runtime | Great for dev-tool agents; overweight for a chat PA with a fixed toolset. |
| n8n / Home Assistant + LLM nodes | Fast to prototype, but the routing/confidence logic and approval flows get awkward in visual builders. Fine as a fallback. |
| Cloudflare Workers + D1 | Cheap and slick for webhooks/cron, but Playwright and long agent loops don't fit; would force a second runtime anyway. |

---

## 3. Model routing & cost control

> **Path note:** the tiered routing below is fully realized in **Path B** (it's what the
> scaffold implements). Under **Path A**, Hermes runs a single model (Sonnet recommended,
> ~$15–30/mo at family volume) and the router tiers don't apply — the remaining cost levers
> there are prompt caching (Hermes-managed), doing digests/statement ingestion through the
> MCP server on the Batch API, and revisiting routing if Hermes grows multi-model support.

This is the core of the "cost effective" requirement. Three tiers plus a free tier:

| Tier | Model | $/MTok in / out | Used for | Expected share |
|---|---|---|---|---|
| 0 | **none** (deterministic code) | — | button taps, /commands, scheduled reminder sends, recurring-bill generation | ~30% of events |
| 1 | **Haiku 4.5** | $1 / $5 | intent routing (every message), simple single-tool CRUD ("add milk to the list", "when is Remy's checkup?") | ~50% |
| 2 | **Sonnet 4.6** (or Sonnet 5 at intro pricing $2/$10 through 2026-08-31) | $3 / $15 | multi-step planning, task extraction from rambling messages, budget analysis, cart building | ~19% |
| 3 | **Opus 4.8** | $5 / $25 | rare: monthly budget deep-dives, gnarly scheduling optimization | ~1% |

### Routing mechanics
1. **Router call**: every inbound message → Haiku with a strict-schema classification tool:
   `{intent, complexity: simple|multi_step|analysis, confidence: 0-1, target_tools[]}`.
   Sub-cent per call.
2. **Confidence gating** (the "determine confidence before jumping to higher models" idea):
   - Router confidence ≥ 0.8 and `simple` → Haiku executes with only the whitelisted tools.
   - Confidence < 0.8, or `multi_step` → Sonnet.
   - **Validator-based escalation** rather than self-reported confidence where possible:
     Haiku's output is checked by *code* (does the date parse? does the task have an owner?
     did the tool call validate against the strict schema?). Failed validation → retry once
     on Sonnet. Objective checks beat asking the model how confident it feels.
   - Sonnet flags `needs_deeper_analysis` → Opus, capped at N calls/day.
3. **Effort tuning**: Haiku default; Sonnet with `output_config.effort: "medium"` for routine
   work, `"high"` for planning. (Adaptive thinking on; never `budget_tokens` — removed on
   current models.)

### Token-cost hygiene
- **Prompt caching everywhere.** Frozen system prompt + tool definitions first, volatile
  context (today's date, calendar snapshot) after the last cache breakpoint. Cache reads are
  ~0.1× input price; the family-context preamble (~3–5K tokens) then costs ~pennies/day instead
  of dollars. Watch the silent invalidators: no timestamps interpolated into the system prompt.
- **Batch API for the non-interactive work**: nightly bill scan, weekly digest, meal-plan
  generation — 50% off, latency irrelevant.
- **Small context by design**: agent memory lives in SQLite/markdown files the model reads
  through tools on demand, not stuffed into every prompt.
- **Per-tier daily budget caps** in the orchestrator (e.g. Opus hard-capped at $0.50/day)
  with a Telegram warning when 80% consumed.

### Estimated running cost

Assumptions: ~25 agent interactions/day across the family, avg 2.5 model calls per interaction,
~4K input (≥70% cache-read) / 400 output per call, mix as in the table above.

| Item | Est. monthly |
|---|---|
| Haiku (routing + simple) | ~$2–4 |
| Sonnet (planning) | ~$6–12 |
| Opus (capped escalations) | ~$1–3 |
| Batch jobs (digest, scans) | ~$1 |
| **Anthropic API total** | **~$10–20/mo** |
| VPS (Hetzner CX22 or Fly.io) | ~$5/mo |
| Telegram Bot API, Google Calendar API, SQLite | $0 |
| **Total** | **~$15–25/mo (Path B, tiered)** |

Under **Path A** (Hermes on Sonnet full-time) the API line rises to roughly $15–30/mo;
total ~$20–35/mo. Worst month with heavy use maybe $35–45. Cheaper than one takeaway pizza order it will inevitably
be asked to place.

---

## 4. Tools & integrations

The same toolset serves both paths: under Path A these are exposed via the **family-tools
MCP server**; under Path B they're registered directly on the SDK tool runner. The SQLite
data model, audit log, and approval/spend-cap code are identical either way.

| Tool (exposed to the model) | Backed by | Notes |
|---|---|---|
| `calendar_read` / `calendar_write` | Google Calendar API (service account or OAuth on a family Google account) | Free. Shared "Family" calendar + read access to personal calendars that opt in. |
| `task_create` / `task_update` / `task_list` | SQLite | Owner, due window, context-trigger expression, status. |
| `shopping_list_*` | SQLite | Running list with store affinity (Migros vs Galaxus vs anywhere). |
| `bills_*` / `budget_query` | SQLite | Recurring bills register + transactions table, populated by statement ingestion. |
| `statement_ingest` | Claude PDF support + Batch API | Family member drops a statement PDF in chat → transactions extracted, categorized, recurring bills detected/updated. |
| `send_message` / `ask_approval` | Telegram Bot API | `ask_approval` renders inline buttons and **blocks** the flow until tapped — the human gate. Proactive sends are free, any time. |
| `remember` / `recall` | Markdown memory files per family member + shared | Preferences ("Remy is dairy-free"), correction history. |
| `web_search` | Anthropic server-side web search tool | Price comparison, product research. Server-side, no scraping infra. |
| `migros_cart_build` / `galaxus_cart_build` | Playwright worker (Phase 3) | Always terminates before payment; checkout only fires from an `ask_approval` = yes. |
| *(cron, not a tool)* reminder engine | node-cron | Fires context-triggered tasks by joining tasks × upcoming calendar events. |

---

## 5. Security & safety

**Money is the headline risk; treat the purchase path as hostile-by-default.**

1. **Human-in-the-loop on all spending.** Checkout is a deterministic code path that only
   executes after a Telegram button tap from an allowlisted adult. The model can *propose*,
   never *pay*. Enforced in the orchestrator, not the prompt.
2. **Hard limits in code**: per-order cap (e.g. CHF 200), monthly purchasing cap, merchant
   allowlist (Migros, Galaxus only). Exceeding = flat refusal + notification, no override
   via chat.
3. **Prompt injection**: anything ingested from outside the family — emails, web pages,
   product descriptions — is untrusted. Untrusted content can *inform* answers but can never
   *trigger* tool calls with side effects; the orchestrator tags message provenance and the
   purchase/calendar-write tools reject turns whose trigger originated from ingested content
   without a fresh human confirmation.
4. **Identity**: Telegram user-ID allowlist (plus the bot's webhook secret token); kids (later) get a restricted role — no purchase
   approval rights, no budget visibility if desired.
5. **Secrets**: API keys and the Playwright browser profile live on the VPS in env vars /
   an encrypted volume; never in the repo, never in prompts (prompts persist in logs).
   Store card details only inside the merchant accounts themselves (Migros/Galaxus saved
   payment), never in the agent's DB.
6. **Banking data**: statement PDFs are read-only, pull-based by nature — exactly right. Never store e-banking credentials; statements are deleted from disk after ingestion (transactions stay in SQLite). Avoid
   storing e-banking credentials. Skip Swiss open-banking (bLink etc.) — not realistically
   accessible to personal projects.
7. **Audit log**: every tool call with side effects (calendar writes, purchases, budget edits)
   appended to an immutable log table; weekly digest includes "what the agent did".
8. **Data privacy**: family PII stays in your SQLite on your box. Anthropic API data is not
   used for training; standard retention applies (30 days). Keep especially sensitive items
   (medical, etc.) in memory files the model only reads on demand.
9. **Blast-radius separation**: the Playwright worker runs as a separate OS user/container
   from the orchestrator; a compromised browser session can't read the API keys.
10. **Hermes-specific (Path A)**: money-touching logic lives only in the MCP server, outside
    the agent's self-editable skills; Hermes runs in Docker with its sandbox on and a command
    allowlist; skill auto-authoring reviewed (or disabled) once purchase tools are attached;
    versions pinned and upgraded deliberately, reading release notes — it's a young,
    fast-moving project.

---

## 6. Implementation roadmap

| Phase | Scope | Effort (evenings) |
|---|---|---|
| **0a. Hermes trial (decision gate)** | Docker + Hermes + Telegram gateway on Sonnet; two family members use it over a weekend. Verify multi-user identity, stability, and that per-person identity can reach MCP tools. Pass → Path A; fail → Path B. | 1 + a weekend of casual use |
| **0b. Skeleton** | *Path A*: port the scaffold's task tools + SQLite into the family-tools MCP server, attach to Hermes. *Path B*: already built (`family-agent/` — bot, router, task tools). | A: 2–3 · B: 0 (done) |
| **1. PA core** | Google Calendar tools, context-triggered reminders (calendar × tasks join). *Path A*: reminders via Hermes NL cron calling MCP; memory is Hermes-native. *Path B*: node-cron + memory files + per-tier budget caps. | 4–7 |
| **2. Money** | Bills register + reminder cron, statement-PDF ingestion pipeline, budget queries, weekly digest via Batch API (in the MCP server on both paths). | 4–6 |
| **3. Purchasing** | Shopping list → deep-link mode (decided launch scope); `ask_approval` + hard spend caps server-side; Playwright cart automation deferred. | 3–5 |
| **4. Backlog** | Meal planning, inbox ingestion, chores, document vault — pick by family demand. *Path A bonus*: many of these become Hermes skills rather than code. | ongoing |

**Stack**: TypeScript, `better-sqlite3`, `googleapis`, `@anthropic-ai/sdk`, `playwright`
(Phase 3). *Path A adds*: Hermes Agent (Docker) + an MCP server package (`@modelcontextprotocol/sdk`).
*Path B adds*: `grammy` (Telegram) + `node-cron` + the SDK tool runner (`betaZodTool`).

### Decisions
0. **Harness: pending the Hermes trial (Phase 0a).** Preferred: Hermes Agent as harness with
   our family-tools MCP server. Fallback: the already-built custom orchestrator. The domain
   code (tools, SQLite, money gates) is shared between both, so the trial risks nothing.

Resolved:
1. **Chat surface: Telegram.** Family group + per-person DMs, free unlimited messaging and
   proactive reminders, inline approval buttons, PDF uploads. (WhatsApp was ruled out: the
   Business API blocks group chat for small accounts and charges per proactive message. Slack
   ruled out: 90-day free-tier history, workplace-shaped.) Chat layer is a thin adapter, so
   revisiting WhatsApp later is cheap.
2. **Calendar: Google Calendar.** Shared family calendar as source of truth; agent is a client.
3. **Purchasing: deep-link mode at launch.** Agent produces exact Migros/Galaxus product links +
   quantities; humans tap through. Browser automation deferred.
4. **Budget data: statement documents.** Family drops bank/card statement PDFs in chat; agent
   ingests via Claude PDF parsing on the Batch API. No YNAB, no e-banking credentials.
