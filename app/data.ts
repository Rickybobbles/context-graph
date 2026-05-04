/* ═══════════════════════════════════════
   CONTEXT GRAPH — DATA MODEL

   Each item is a single step in the underwriting
   journey, classified by type and recording status.

   Types: information, task, insight, output, decision
   Recorded: boolean (is this captured somewhere?)
   CapturedIn: where the info lives (or 'Memory' if not)
   ═══════════════════════════════════════ */

export type ItemType = 'information' | 'task' | 'insight' | 'output' | 'decision' | 'discarded'

export interface Item {
  s: number       // stage index
  t: ItemType     // type
  l: string       // label
  rec: boolean    // recorded?
  cap: string     // captured in (Email, Slack, Excel, Memory, etc.)
  r?: string      // reason (for decisions)
  auto?: string   // automation tool (Lead Engine, PIA, IREA, Aria, Peer)
}

export type AiLevel = 'automate' | 'augment' | 'human'

export interface Stage {
  title: string
  actor: string
  captured: string
  desc: string
  isDecisionGate?: boolean
  color?: string         // stage-specific color for visual
  hours?: number         // estimated hours per stage
  aiLevel?: AiLevel      // automate / augment / human
}

export const TYPE_META: Record<ItemType, { color: string; label: string }> = {
  information: { color: '#e8e4df', label: 'Information' },
  task:        { color: '#7EA3CC', label: 'Task' },
  insight:     { color: '#C9A84C', label: 'Insight' },
  output:      { color: '#3D8B80', label: 'Output' },
  decision:    { color: '#B84D7A', label: 'Decision' },
  discarded:   { color: '#3a3a3a', label: 'Discarded' },
}

export const CLUSTER_ORDER: ItemType[] = [
  'output', 'decision', 'insight', 'task', 'discarded', 'information'
]

export const STAGES: Stage[] = [
  {
    title: 'Exposé Received',
    actor: 'Broker',
    captured: 'PDF in email',
    desc: 'A broker sends a 48-unit residential building in Munich-Pasing. A PDF with photos, a floor plan, and high-level numbers. It sits in someone\u2019s inbox.',
  },
  {
    title: 'Broker Call',
    actor: 'Sourcing person',
    captured: 'Email, Slack',
    desc: 'Sourcing calls the broker. Learns the seller is motivated, there\u2019s competing interest, the roof was done 3 years ago. This goes into an email or Slack message \u2014 unstructured, unsearchable, buried within days.',
  },
  {
    title: 'Into the Model',
    actor: 'Analyst',
    captured: 'Excel (partially)',
    desc: 'The analyst interprets the information into a financial model. They choose a cap rate, set rent growth, pick a renovation timeline. These decisions shape the entire outcome \u2014 but they\u2019re just numbers in cells.',
  },
  {
    title: 'Side Analysis',
    actor: 'Analyst',
    captured: 'Scratch files \u2014 discarded',
    desc: 'Rough comps, quick market checks, back-of-envelope calculations. Used once to calibrate the model, then filed away or deleted. The insight they generated was real. The work that produced it is gone.',
  },
  {
    title: 'Capital Questions',
    actor: 'Capital salesperson \u2192 Analyst',
    captured: 'Memory',
    desc: 'The capital team asks: \u201cWhat\u2019s the downside case?\u201d The analyst answers from memory. The Q&A shapes investor confidence but none of it is captured.',
  },
  {
    title: 'Pre-Screen Meeting',
    actor: 'Internal committee',
    captured: 'Slack, loose notes',
    desc: 'A room full of people decides whether to proceed. The decision is recorded \u2014 barely. The reasoning, the objections raised, the conditions attached: mostly lost.',
    isDecisionGate: true,
  },
  {
    title: 'Site Visit',
    actor: 'Analyst / Asset manager',
    captured: 'Photos, notes, memory',
    desc: 'Walk the building. Talk to the property manager. Photos taken, mental notes made. The onus is on the individual to write all this up later.',
  },
  {
    title: 'Report & Present',
    actor: 'Analyst',
    captured: 'DD report, deck',
    desc: 'The analyst writes a due diligence report. They decide what to include and what to leave out. The report captures maybe 60% of what they know.',
  },
  {
    title: 'Investment Committee',
    actor: 'Committee',
    captured: 'IC deck, vote record',
    desc: 'The final gate. The IC deck captures the what \u2014 the numbers. The why \u2014 the hundred small decisions that built those numbers \u2014 is invisible.',
    isDecisionGate: true,
  },
]

export const ITEMS: Item[] = [
  // ── Stage 0: Exposé Received ──
  { s:0, t:'information', l:'Exposé PDF arrives',            rec:true,  cap:'PDF' },
  { s:0, t:'information', l:'Property photos',               rec:true,  cap:'PDF' },
  { s:0, t:'information', l:'Floor plan',                    rec:true,  cap:'PDF' },
  { s:0, t:'information', l:'High-level financial summary',  rec:true,  cap:'PDF' },
  { s:0, t:'task',        l:'Review exposé contents',        rec:false, cap:'Memory' },
  { s:0, t:'decision',    l:'Decide to pursue this lead',    rec:false, cap:'Memory', r:'Location matches fund strategy, asking price implies cap rate above minimum threshold' },

  // ── Stage 1: Broker Call ──
  { s:1, t:'task',        l:'Call the broker',               rec:false, cap:'Phone call' },
  { s:1, t:'insight',     l:'Seller motivated \u2014 tax deadline in 60 days', rec:false, cap:'Memory' },
  { s:1, t:'information', l:'Competing interest from another buyer', rec:true, cap:'Email' },
  { s:1, t:'information', l:'Roof done 3 years ago',         rec:false, cap:'Phone call' },
  { s:1, t:'task',        l:'Write email summary of call',   rec:true,  cap:'Email' },
  { s:1, t:'decision',    l:'Revise pricing expectations downward', rec:false, cap:'Memory', r:'Seller urgency suggests 5\u20138% below asking is realistic' },

  // ── Stage 2: Into the Model ──
  { s:2, t:'task',        l:'Extract key data from exposé',  rec:true,  cap:'Excel' },
  { s:2, t:'task',        l:'Research market comparables',   rec:false, cap:'Memory' },
  { s:2, t:'decision',    l:'Set cap rate at 4.5%',          rec:false, cap:'Memory', r:'3 comps in submarket: 4.2\u20134.8%. Went mid-range' },
  { s:2, t:'decision',    l:'Set rent growth at 2.5%/yr',    rec:false, cap:'Memory', r:'Munich Mietspiegel 2.1% + 0.4% upgrade uplift' },
  { s:2, t:'decision',    l:'Set renovation at 18 months',   rec:false, cap:'Memory', r:'Similar portfolio project took 14mo. Added buffer for local permitting delays' },
  { s:2, t:'output',      l:'Build 10-year DCF model',       rec:true,  cap:'Excel' },
  { s:2, t:'output',      l:'Returns summary sheet',         rec:true,  cap:'Excel' },
  { s:2, t:'output',      l:'Sensitivity table',             rec:true,  cap:'Excel' },
  { s:2, t:'insight',     l:'Returns above hurdle rate',     rec:false, cap:'Memory' },

  // ── Stage 3: Side Analysis ──
  { s:3, t:'task',        l:'Pull comparable transactions',  rec:false, cap:'Scratch file' },
  { s:3, t:'task',        l:'Quick market rent check',       rec:false, cap:'Scratch file' },
  { s:3, t:'task',        l:'Back-of-envelope vacancy calc', rec:false, cap:'Scratch file' },
  { s:3, t:'decision',    l:'Select which comps to use',     rec:false, cap:'Memory', r:'Excluded one distressed sale that would skew the range' },
  { s:3, t:'insight',     l:'Calibration insight from comps', rec:false, cap:'Memory' },
  { s:3, t:'discarded',   l:'Scratch comp files',            rec:false, cap:'Deleted' },
  { s:3, t:'discarded',   l:'Market check notes',            rec:false, cap:'Deleted' },
  { s:3, t:'discarded',   l:'Calculation sheet',             rec:false, cap:'Deleted' },

  // ── Stage 4: Capital Questions ──
  { s:4, t:'information', l:'Investor asks about downside',  rec:true,  cap:'Email' },
  { s:4, t:'task',        l:'Analyst runs mental sensitivity', rec:false, cap:'Memory' },
  { s:4, t:'decision',    l:'Quote \u201caround 9%\u201d downside IRR', rec:false, cap:'Memory', r:'Mental math: base 14.2% minus ~5pts. Not formally modelled' },
  { s:4, t:'information', l:'Investor follow-up email',      rec:true,  cap:'Email' },

  // ── Stage 5: Pre-Screen Meeting ──
  { s:5, t:'task',        l:'Prepare pre-screen summary',    rec:true,  cap:'Slides' },
  { s:5, t:'task',        l:'Present to committee',          rec:false, cap:'Meeting' },
  { s:5, t:'information', l:'Committee discusses risks',     rec:false, cap:'Meeting' },
  { s:5, t:'decision',    l:'Committee votes to proceed',    rec:true,  cap:'Meeting notes', r:'Returns above hurdle, location aligns with strategy, manageable reno scope' },
  { s:5, t:'decision',    l:'Adjust target price to \u20ac7.5\u20138.0M', rec:false, cap:'Memory', r:'Reflects seller motivation + capex risk. CIO suggested going aggressive' },
  { s:5, t:'decision',    l:'Approve DD budget of \u20ac15K',  rec:false, cap:'Memory', r:'Standard for deal size \u2014 structural survey, legal, environmental' },
  { s:5, t:'output',      l:'Pre-screen summary deck',       rec:true,  cap:'Slides' },
  { s:5, t:'information', l:'Slack: \u201cPre-screen passed\u201d', rec:true, cap:'Slack' },

  // ── Stage 6: Site Visit ──
  { s:6, t:'task',        l:'Travel to property',            rec:false, cap:'Memory' },
  { s:6, t:'task',        l:'Inspect exterior and facade',   rec:false, cap:'Memory' },
  { s:6, t:'task',        l:'Walk common areas and units',   rec:false, cap:'Memory' },
  { s:6, t:'task',        l:'Talk to property manager',      rec:false, cap:'Phone call' },
  { s:6, t:'insight',     l:'Facade worse than photos',      rec:false, cap:'Memory' },
  { s:6, t:'insight',     l:'Two balconies with water damage', rec:true, cap:'Photos' },
  { s:6, t:'insight',     l:'Average tenancy 6+ years',      rec:false, cap:'Memory' },
  { s:6, t:'information', l:'Photos taken on site',          rec:true,  cap:'Photos' },
  { s:6, t:'information', l:'Handwritten notes',             rec:true,  cap:'Notes' },
  { s:6, t:'decision',    l:'Revise capex upward by \u20ac200K', rec:false, cap:'Memory', r:'Facade deterioration, no maintenance in 5+ years, balcony water damage' },
  { s:6, t:'decision',    l:'Assess tenants as stable',      rec:false, cap:'Memory', r:'Long tenancies, young professional mix, low complaint history' },

  // ── Stage 7: Report & Present ──
  { s:7, t:'task',        l:'Write DD report',               rec:true,  cap:'Report' },
  { s:7, t:'decision',    l:'Decide what to include/omit',   rec:false, cap:'Memory', r:'Prioritised financials and risk factors. Left out tenant profiles and parking \u2014 \u201cnot enough room\u201d' },
  { s:7, t:'output',      l:'DD report',                     rec:true,  cap:'Report' },
  { s:7, t:'output',      l:'Presentation deck',             rec:true,  cap:'Slides' },
  { s:7, t:'output',      l:'Updated financial model',       rec:true,  cap:'Excel' },
  { s:7, t:'insight',     l:'Report captures ~60% of knowledge', rec:false, cap:'Memory' },

  // ── Stage 8: Investment Committee ──
  { s:8, t:'task',        l:'Present full picture to IC',    rec:false, cap:'Meeting' },
  { s:8, t:'information', l:'Committee deliberates',         rec:false, cap:'Meeting' },
  { s:8, t:'output',      l:'IC deck',                       rec:true,  cap:'Slides' },
  { s:8, t:'decision',    l:'Acquire at \u20ac7.9M \u2014 14.2% IRR', rec:true, cap:'IC minutes', r:'Clears 12% hurdle. Risk-adjusted, diversification benefit, Munich market outlook' },
  { s:8, t:'decision',    l:'Negotiation ceiling at \u20ac8.1M', rec:false, cap:'Memory', r:'Above this, IRR below 12.5% \u2014 too thin for renovation execution risk' },
  { s:8, t:'output',      l:'Vote record',                   rec:true,  cap:'IC minutes' },
]

/* ── Computed helpers (accept any item set) ── */
export function getStageItems(items: Item[], stageIdx: number) {
  return items.filter(it => it.s === stageIdx)
}

export function getStageDecisions(items: Item[], stageIdx: number) {
  return items.filter(it => it.s === stageIdx && it.t === 'decision')
}

export function getRunningCounts(items: Item[], upToStage: number) {
  let made = 0, recorded = 0
  items.forEach(it => {
    if (it.s <= upToStage && it.t === 'decision') {
      made++
      if (it.rec) recorded++
    }
  })
  return { made, recorded }
}

export function getTypeTotals(items: Item[]) {
  const totals: Partial<Record<ItemType, number>> = {}
  items.forEach(it => { totals[it.t] = (totals[it.t] || 0) + 1 })
  return totals
}
