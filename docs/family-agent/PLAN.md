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
| **Conversational PA** | Per-person WhatsApp chat with the assistant (shared brain behind every chat — see §2). Understands natural requests: "we're at Sarah's for dinner Saturday", "remind me to renew Remy's health insurance". |
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

### Recommendation: thin TypeScript orchestrator + Claude API tool use

```
WhatsApp (1:1 chat per family member,
Meta Cloud API, dedicated number)
        │  webhook
        ▼
┌─────────────────────────────────────────────┐
│  Orchestrator (Node/TS, single small VPS)   │
│                                             │
│  1. Auth: WhatsApp number allowlist         │
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
  choice for cost routing, and your tools (calendar, DB, WhatsApp buttons) are all client-side
  anyway. Managed Agents shines when you want Anthropic to host a container workspace — not needed
  here, and it adds cost. The SDK's beta **tool runner** (`client.beta.messages.toolRunner` with
  `betaZodTool`) handles the agentic loop for you; drop to the manual loop only for the purchase
  flow where you want a human-approval gate between tool call and execution.
- **WhatsApp (decided)** via Meta's Cloud API directly — no BSP middleman, no platform markup.
  What this means in practice:
  - **No family group chat.** Meta's native group support in the Cloud API is gated to businesses
    with 100k+ monthly conversations. Instead: each family member gets a 1:1 chat with the
    assistant, and the **shared brain** lives server-side — everyone talks to the same state
    (tasks, calendar, lists), and the agent fans announcements out to each person individually.
    Day-to-day this feels close to a group ("tell everyone dinner moved to 7") without being one.
  - **Inbound is free.** Anything a family member sends opens a 24-hour service window in which
    all replies are free and unlimited — the whole conversational side costs nothing.
  - **Proactive pings cost a few cents.** Reminders outside a 24h window ("grab milk at 16:50",
    "Krankenkasse due Friday") must be pre-approved **utility template** messages, billed per
    delivered message (~CHF 0.03–0.05 in CH). At 5–10 nudges/day family-wide that's roughly
    CHF 5–15/month. Mitigation: batch nudges, and prefer delivering into an already-open window.
  - **Approval buttons work.** WhatsApp interactive reply buttons (up to 3) cover the
    Approve/Edit/Cancel checkout gate, both in service windows and in templates.
  - **Setup friction (one-time):** a Meta Business account + verification, a **dedicated phone
    number** for the assistant (a cheap eSIM or virtual number — your personal numbers stay
    untouched), and template approval for the reminder formats.
  - Fallback if Meta setup proves too painful: Telegram has none of these constraints (free,
    groups, buttons) at the cost of the family adopting another app. The orchestrator's chat
    layer is a thin adapter either way, so switching later is cheap.
- **One small VPS + SQLite** over serverless: the agent needs cron jobs, a persistent Playwright
  browser profile, and a long-lived event loop. A €4–5/mo Hetzner box (or Fly.io machine, or a
  Raspberry Pi at home for ~free) covers all of it. SQLite is plenty for one family; no managed
  DB to pay for.
- **Google Calendar as the calendar source of truth** — the family already gets native
  phone/watch UX for free; the agent is a *client* of the calendar, not a replacement.

### Alternatives considered
| Option | Verdict |
|---|---|
| Managed Agents (Anthropic-hosted sessions) | Clean, but per-session containers + always-Opus-class defaults work against the cost goal. Revisit if the orchestrator grows painful. |
| Claude Agent SDK / Claude Code as runtime | Great for dev-tool agents; overweight for a chat PA with a fixed toolset. |
| n8n / Home Assistant + LLM nodes | Fast to prototype, but the routing/confidence logic and approval flows get awkward in visual builders. Fine as a fallback. |
| Cloudflare Workers + D1 | Cheap and slick for webhooks/cron, but Playwright and long agent loops don't fit; would force a second runtime anyway. |

---

## 3. Model routing & cost control

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
  with a WhatsApp warning when 80% consumed.

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
| WhatsApp — inbound/service messages | $0 |
| WhatsApp — proactive reminder templates | ~CHF 5–15 |
| Google Calendar API, SQLite | $0 |
| **Total** | **~$15–25/mo** |

Worst month with heavy use maybe $35. Cheaper than one takeaway pizza order it will inevitably
be asked to place.

---

## 4. Tools & integrations

| Tool (exposed to the model) | Backed by | Notes |
|---|---|---|
| `calendar_read` / `calendar_write` | Google Calendar API (service account or OAuth on a family Google account) | Free. Shared "Family" calendar + read access to personal calendars that opt in. |
| `task_create` / `task_update` / `task_list` | SQLite | Owner, due window, context-trigger expression, status. |
| `shopping_list_*` | SQLite | Running list with store affinity (Migros vs Galaxus vs anywhere). |
| `bills_*` / `budget_query` | SQLite | Recurring bills register + transactions table, populated by statement ingestion. |
| `statement_ingest` | Claude PDF support + Batch API | Family member drops a statement PDF in chat → transactions extracted, categorized, recurring bills detected/updated. |
| `send_message` / `ask_approval` | WhatsApp Cloud API | `ask_approval` renders interactive reply buttons and **blocks** the flow until tapped — the human gate. Proactive sends outside a 24h window go as utility templates. |
| `remember` / `recall` | Markdown memory files per family member + shared | Preferences ("Remy is dairy-free"), correction history. |
| `web_search` | Anthropic server-side web search tool | Price comparison, product research. Server-side, no scraping infra. |
| `migros_cart_build` / `galaxus_cart_build` | Playwright worker (Phase 3) | Always terminates before payment; checkout only fires from an `ask_approval` = yes. |
| *(cron, not a tool)* reminder engine | node-cron | Fires context-triggered tasks by joining tasks × upcoming calendar events. |

---

## 5. Security & safety

**Money is the headline risk; treat the purchase path as hostile-by-default.**

1. **Human-in-the-loop on all spending.** Checkout is a deterministic code path that only
   executes after a WhatsApp button tap from an allowlisted adult. The model can *propose*,
   never *pay*. Enforced in the orchestrator, not the prompt.
2. **Hard limits in code**: per-order cap (e.g. CHF 200), monthly purchasing cap, merchant
   allowlist (Migros, Galaxus only). Exceeding = flat refusal + notification, no override
   via chat.
3. **Prompt injection**: anything ingested from outside the family — emails, web pages,
   product descriptions — is untrusted. Untrusted content can *inform* answers but can never
   *trigger* tool calls with side effects; the orchestrator tags message provenance and the
   purchase/calendar-write tools reject turns whose trigger originated from ingested content
   without a fresh human confirmation.
4. **Identity**: WhatsApp sender-number allowlist (webhook payloads are Meta-signed; verify the signature); kids (later) get a restricted role — no purchase
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

---

## 6. Implementation roadmap

| Phase | Scope | Effort (evenings) |
|---|---|---|
| **0. Skeleton** | Meta Business setup (number, verification, webhook) + VPS + SQLite + Anthropic SDK; echo agent with Haiku router and one tool (`task_create`). | 3–4 (Meta verification adds calendar wait time) |
| **1. PA core** | Google Calendar tools, task CRUD, context-triggered reminders (calendar × tasks join), memory files, prompt caching, per-tier budget caps. | 5–8 |
| **2. Money** | Bills register + reminder cron, statement-PDF ingestion pipeline, budget queries, weekly digest via Batch API. | 4–6 |
| **3. Purchasing** | Shopping list → deep-link mode (decided launch scope); Playwright cart automation deferred until deep links feel limiting. | 3–5 |
| **4. Backlog** | Meal planning, inbox ingestion, chores, document vault — pick by family demand. | ongoing |

**Stack**: TypeScript, `@anthropic-ai/sdk` (tool runner + `betaZodTool`), WhatsApp Cloud API (plain webhooks + fetch — no SDK needed),
`googleapis`, `better-sqlite3`, `node-cron`, `playwright`. One repo, one process (plus the
isolated Playwright worker in Phase 3).

### Decisions (resolved)
1. **Chat surface: WhatsApp** (Meta Cloud API, direct). 1:1 chats per family member with a
   shared server-side brain; no group chat (API-gated); proactive reminders cost ~CHF 0.03–0.05
   each as utility templates. Chat layer built as an adapter so Telegram remains a cheap fallback.
2. **Calendar: Google Calendar.** Shared family calendar as source of truth; agent is a client.
3. **Purchasing: deep-link mode at launch.** Agent produces exact Migros/Galaxus product links +
   quantities; humans tap through. Browser automation deferred.
4. **Budget data: statement documents.** Family drops bank/card statement PDFs in chat; agent
   ingests via Claude PDF parsing on the Batch API. No YNAB, no e-banking credentials.
