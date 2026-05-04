/* ═══════════════════════════════════════
   CONTEXT GRAPH — PROPERTI WORKFLOW

   Properti's 9-step transaction model with
   their specific AI tools mapped to each step.
   65% automated today, targeting 90%.

   Tools: Lead Engine, PIA, IREA, Aria, Peer
   ═══════════════════════════════════════ */

import type { Item, Stage } from './data'

export const PROPERTI_STAGES: Stage[] = [
  {
    title: 'Lead Generated',
    actor: 'Lead Engine (100% automated)',
    captured: 'CRM',
    desc: 'Leads flow in through properti\u2019s website, portals, and Peer (the voice agent that re-engages cold seller leads \u2014 \u20ac1M net revenue in its first 10 months). Lead Engine captures, deduplicates, and routes them automatically. No human touches this step.',
    color: '#7B8EC8', hours: 2, aiLevel: 'automate',
  },
  {
    title: 'Qualified & Scored',
    actor: 'PIA (80% automated)',
    captured: 'CRM, phone call',
    desc: 'PIA scores and pre-qualifies the lead. But the 20% that\u2019s human is where context lives \u2014 the agent calls the seller, learns they\u2019re divorcing, need to close fast, have emotional attachment to the price. None of that goes into the CRM.',
    color: '#D4D0CA', hours: 1, aiLevel: 'augment',
  },
  {
    title: 'Agent Allocated',
    actor: 'Lead Engine (100% automated)',
    captured: 'CRM',
    desc: 'Lead Engine assigns the deal to an agent based on location, capacity, and expertise. Fully automated. The agent gets a notification with the lead details \u2014 but not the context from the qualifying call.',
    color: '#A8C4D8', hours: 0.5, aiLevel: 'automate',
  },
  {
    title: 'Valuation Generated',
    actor: 'IREA + Aria (90% automated)',
    captured: 'Platform, memory',
    desc: 'Aria (the valuation chatbot) auto-fills data from uploaded documents. IREA generates a hedonic valuation. The agent visits, walks the property, and adjusts. Their local knowledge \u2014 the new tram line, the school reputation, the neighbour\u2019s building plans \u2014 shapes the final number but never enters the system.',
    color: '#B8C98E', hours: 6, aiLevel: 'augment',
  },
  {
    title: 'Activation & Listing',
    actor: 'IREA (90% automated)',
    captured: 'Platform',
    desc: 'When the agent signs the seller contract, AI writes the listing text, geo-targets the audience, uploads photos, and publishes across all marketplaces automatically. The agent reviews and approves \u2014 but their editorial judgment (why this photo, why this angle, what to downplay) is invisible.',
    color: '#8BA87A', hours: 18, aiLevel: 'augment',
  },
  {
    title: 'Seller-Buyer Matching',
    actor: 'IREA (100% automated)',
    captured: 'Platform',
    desc: 'IREA matches the listing against the buyer database automatically. No human involvement. But the algorithm can\u2019t capture what the agent knows from viewings \u2014 that this couple loved the garden, that this investor only wants south-facing units.',
    color: '#C9B88C', hours: 8, aiLevel: 'automate',
  },
  {
    title: 'Buyer Qualifying',
    actor: 'PIA (90% automated)',
    captured: 'CRM, phone call',
    desc: 'PIA pre-qualifies buyers: budget, financing status, timeline. But the final 10% \u2014 the agent\u2019s call to assess seriousness, understand motivations, gauge flexibility on price \u2014 happens on the phone and disappears.',
    color: '#6B9DAB', hours: 12, aiLevel: 'augment',
  },
  {
    title: 'Visit & Consultation',
    actor: 'Broker in the loop',
    captured: 'Memory, photos',
    desc: 'The one step that\u2019s fully human. The agent shows the property, reads the room, builds trust, handles objections. This is where deals are won or lost. Every observation, every buyer reaction, every conversation \u2014 it all lives in the agent\u2019s head.',
    isDecisionGate: true,
    color: '#4A7D8B', hours: 24, aiLevel: 'human',
  },
  {
    title: 'Deal Closed',
    actor: 'IREA (80% automated)',
    captured: 'Legal docs, email, memory',
    desc: 'IREA handles contract generation and workflow. But the 20% that\u2019s human \u2014 negotiation strategy, notary coordination, the decision to accept one offer over another, the handover details \u2014 is where context matters most and is captured least.',
    isDecisionGate: true,
    color: '#2D6B6E', hours: 8, aiLevel: 'augment',
  },
]

export const PROPERTI_ITEMS: Item[] = [
  // ── Stage 0: Lead Generated ──
  { s:0, t:'information', l:'Lead submitted via website/portal',  rec:true,  cap:'CRM', auto:'Lead Engine' },
  { s:0, t:'task',        l:'Lead deduplicated and enriched',     rec:true,  cap:'CRM', auto:'Lead Engine' },
  { s:0, t:'task',        l:'Peer re-engages cold seller leads',  rec:true,  cap:'CRM', auto:'Peer' },
  { s:0, t:'information', l:'Lead source and channel tracked',    rec:true,  cap:'CRM', auto:'Lead Engine' },
  { s:0, t:'task',        l:'Lead routed to qualification queue',  rec:true,  cap:'CRM', auto:'Lead Engine' },

  // ── Stage 1: Qualified & Scored ──
  { s:1, t:'task',        l:'AI scores lead based on property data', rec:true, cap:'CRM', auto:'PIA' },
  { s:1, t:'task',        l:'Automated pre-qualification check',   rec:true,  cap:'CRM', auto:'PIA' },
  { s:1, t:'task',        l:'Agent calls seller for context',      rec:false, cap:'Phone call' },
  { s:1, t:'insight',     l:'Seller is divorcing \u2014 needs to close fast', rec:false, cap:'Memory' },
  { s:1, t:'insight',     l:'Emotional attachment to price \u2014 won\u2019t go below CHF 1.2M', rec:false, cap:'Memory' },
  { s:1, t:'insight',     l:'Property has unpermitted extension',  rec:false, cap:'Memory' },
  { s:1, t:'decision',    l:'Lead is worth pursuing despite high price expectation', rec:false, cap:'Memory', r:'Seller motivation is high. Property is in a strong market. Can manage price down during process.' },

  // ── Stage 2: Agent Allocated ──
  { s:2, t:'task',        l:'Lead Engine assigns agent by location/capacity', rec:true, cap:'CRM', auto:'Lead Engine' },
  { s:2, t:'information', l:'Agent receives lead notification with details', rec:true, cap:'CRM', auto:'Lead Engine' },
  { s:2, t:'insight',     l:'Context from qualifying call not passed to agent', rec:false, cap:'Memory' },
  { s:2, t:'task',        l:'Agent reviews lead in CRM',           rec:false, cap:'Memory' },
  { s:2, t:'decision',    l:'Agent accepts the assignment',        rec:true,  cap:'CRM' },

  // ── Stage 3: Valuation Generated ──
  { s:3, t:'information', l:'Seller uploads documents via Aria',   rec:true,  cap:'Platform', auto:'Aria' },
  { s:3, t:'task',        l:'Aria auto-fills valuation data from docs', rec:true, cap:'Platform', auto:'Aria' },
  { s:3, t:'task',        l:'IREA generates hedonic valuation',    rec:true,  cap:'Platform', auto:'IREA' },
  { s:3, t:'task',        l:'Agent visits property',               rec:false, cap:'Memory' },
  { s:3, t:'insight',     l:'New tram line planned 200m away \u2014 value uplift', rec:false, cap:'Memory' },
  { s:3, t:'insight',     l:'Neighbour\u2019s building permit filed \u2014 will block view', rec:false, cap:'Memory' },
  { s:3, t:'insight',     l:'Kitchen and bathroom need updating',  rec:false, cap:'Memory' },
  { s:3, t:'decision',    l:'Adjust valuation up 5% for tram line proximity', rec:false, cap:'Memory', r:'Public transport premium is real but not in the hedonic model. Agent\u2019s local knowledge.' },
  { s:3, t:'decision',    l:'Don\u2019t flag neighbour\u2019s building permit to seller', rec:false, cap:'Memory', r:'Would complicate the mandate conversation. Will factor into pricing instead.' },
  { s:3, t:'output',      l:'Final valuation report',              rec:true,  cap:'Platform' },

  // ── Stage 4: Activation & Listing ──
  { s:4, t:'task',        l:'Agent signs seller mandate (Maklervertrag)', rec:true, cap:'Contract' },
  { s:4, t:'task',        l:'AI writes listing description',       rec:true,  cap:'Platform', auto:'IREA' },
  { s:4, t:'task',        l:'Professional photography booked',     rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'3D tour and virtual staging created',  rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'Geo-targeted audience defined by AI',  rec:true,  cap:'Platform', auto:'IREA' },
  { s:4, t:'task',        l:'Listing auto-published to all marketplaces', rec:true, cap:'Platform', auto:'IREA' },
  { s:4, t:'decision',    l:'Agent selects which photos to feature', rec:false, cap:'Memory', r:'Excluded the dated kitchen. Emphasised the south-facing balcony and garden view.' },
  { s:4, t:'decision',    l:'Agent tweaks AI-written listing text', rec:false, cap:'Memory', r:'AI oversold the parking situation. Agent knows street parking is competitive in this area.' },
  { s:4, t:'output',      l:'Live listing across Homegate, ImmoScout24, properti.com', rec:true, cap:'Platform' },

  // ── Stage 5: Seller-Buyer Matching ──
  { s:5, t:'task',        l:'IREA matches listing to buyer database', rec:true, cap:'Platform', auto:'IREA' },
  { s:5, t:'task',        l:'Automated buyer alerts sent',         rec:true,  cap:'Platform', auto:'IREA' },
  { s:5, t:'information', l:'Match quality scores generated',      rec:true,  cap:'Platform', auto:'IREA' },
  { s:5, t:'insight',     l:'Algorithm can\u2019t know this couple loved the garden at last viewing', rec:false, cap:'Memory' },
  { s:5, t:'insight',     l:'Investor client only wants south-facing \u2014 agent knows, system doesn\u2019t', rec:false, cap:'Memory' },

  // ── Stage 6: Buyer Qualifying ──
  { s:6, t:'task',        l:'PIA pre-qualifies buyers: budget, financing, timeline', rec:true, cap:'CRM', auto:'PIA' },
  { s:6, t:'task',        l:'Automated scheduling for serious buyers', rec:true, cap:'CRM', auto:'PIA' },
  { s:6, t:'task',        l:'Agent calls top buyers to assess seriousness', rec:false, cap:'Phone call' },
  { s:6, t:'insight',     l:'Buyer 1 is pre-approved but relocating and flexible on timing', rec:false, cap:'Memory' },
  { s:6, t:'insight',     l:'Buyer 2 has cash but is lowballing every property in the area', rec:false, cap:'Memory' },
  { s:6, t:'decision',    l:'Prioritise buyer 1 for first viewing slot', rec:false, cap:'Memory', r:'Pre-approved, motivated, flexible. Better chance of clean close.' },

  // ── Stage 7: Visit & Consultation ──
  { s:7, t:'task',        l:'Agent prepares for viewing',          rec:false, cap:'Memory' },
  { s:7, t:'task',        l:'Conduct on-site viewing with buyers', rec:false, cap:'Memory' },
  { s:7, t:'insight',     l:'Buyer 1 emotional about the garden \u2014 strong signal', rec:false, cap:'Memory' },
  { s:7, t:'insight',     l:'Buyer 1\u2019s partner worried about kitchen renovation cost', rec:false, cap:'Memory' },
  { s:7, t:'information', l:'Buyer asks about Nebenkosten and Stockwerkeigent\u00fcmer reserve', rec:false, cap:'Viewing' },
  { s:7, t:'task',        l:'Follow-up call with buyer post-viewing', rec:false, cap:'Phone call' },
  { s:7, t:'insight',     l:'Buyer will offer if kitchen reno cost is manageable', rec:false, cap:'Phone call' },
  { s:7, t:'decision',    l:'Suggest seller includes CHF 15K renovation credit', rec:false, cap:'Memory', r:'Small concession that could unlock the deal. Kitchen is the only objection.' },
  { s:7, t:'task',        l:'Report viewing feedback to seller',   rec:false, cap:'Phone call' },
  { s:7, t:'discarded',   l:'Mental notes from 3 other viewings that went nowhere', rec:false, cap:'Memory' },

  // ── Stage 8: Deal Closed ──
  { s:8, t:'information', l:'Offer received from buyer 1 at asking price', rec:true, cap:'Email' },
  { s:8, t:'task',        l:'IREA generates draft contract',       rec:true,  cap:'Platform', auto:'IREA' },
  { s:8, t:'task',        l:'Agent reviews contract terms',        rec:false, cap:'Memory' },
  { s:8, t:'task',        l:'Coordinate with notary for Beurkundung', rec:true, cap:'Email' },
  { s:8, t:'information', l:'Notary drafts final Kaufvertrag',     rec:true,  cap:'Legal doc' },
  { s:8, t:'task',        l:'Both parties review and sign at notary', rec:true, cap:'Legal doc' },
  { s:8, t:'decision',    l:'Accept buyer 1 over buyer 2 who offered CHF 10K more', rec:false, cap:'Memory', r:'Buyer 1 is cleaner: pre-approved, no conditions, faster timeline. CHF 10K not worth the risk.' },
  { s:8, t:'task',        l:'Grundbuch transfer submitted',        rec:true,  cap:'Legal doc', auto:'IREA' },
  { s:8, t:'task',        l:'Key handover and final walkthrough',  rec:false, cap:'Memory' },
  { s:8, t:'decision',    l:'Don\u2019t flag minor paint scuff at handover', rec:false, cap:'Memory', r:'Cosmetic. Would create tension after a smooth deal.' },
  { s:8, t:'output',      l:'Handover protocol signed',            rec:true,  cap:'Document' },
  { s:8, t:'output',      l:'Commission invoice sent',             rec:true,  cap:'Email' },
  { s:8, t:'task',        l:'Follow-up with buyer and seller',     rec:false, cap:'Phone call' },
  { s:8, t:'discarded',   l:'All verbal agreements and unlogged context from the deal', rec:false, cap:'Memory' },
]
