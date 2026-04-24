/* ═══════════════════════════════════════
   CONTEXT GRAPH — BROKERAGE DATA (Swiss)

   A real estate agent's journey from first
   contact with a property owner through to
   closing and key handover. Swiss market
   specific (Grundbuch, GEAK, notary process,
   Homegate/ImmoScout24, CHF).

   9 stages, ~90 items
   ═══════════════════════════════════════ */

import type { Item, Stage } from './data'

export const BROKERAGE_STAGES: Stage[] = [
  {
    title: 'Lead & First Contact',
    actor: 'Agent',
    captured: 'CRM, phone call',
    desc: 'A lead comes in \u2014 website form, referral, or cold outreach. The agent calls the property owner. In that first conversation, they learn the owner\u2019s motivations, timeline, and price expectations. Most of it stays in the agent\u2019s head.',
  },
  {
    title: 'Property Assessment',
    actor: 'Agent',
    captured: 'Photos, PDF, memory',
    desc: 'The agent visits the property. They walk every room, check the Grundbuch, gather floor plans, and assess the neighbourhood. Half of what they observe never makes it into a system.',
  },
  {
    title: 'Mandate & Pricing',
    actor: 'Agent / Owner',
    captured: 'Platform, contract',
    desc: 'The agent runs a valuation, presents it to the owner, and negotiates terms. The owner pushes back on price. The agent decides to accept the higher ask with a plan to adjust later. The reasoning behind the price is never documented.',
  },
  {
    title: 'Listing Preparation',
    actor: 'Agent / Creative team',
    captured: 'Platform, PDF',
    desc: 'Photography, 3D tours, virtual staging, GEAK certificate, Stockwerkeig\u00fcntemer-Reglement. The agent decides which photos to use, what to emphasise, what to downplay. The listing is an editorial choice \u2014 and the editorial logic is invisible.',
  },
  {
    title: 'Marketing & Go-Live',
    actor: 'Agent / Marketing',
    captured: 'Platform, CRM',
    desc: 'The listing goes live on Homegate, ImmoScout24, and properti.com. Social campaigns launch. Direct outreach to the buyer database. The agent decides how to allocate budget and who to contact first. None of that is recorded.',
  },
  {
    title: 'Viewings & Enquiries',
    actor: 'Agent',
    captured: 'CRM, phone call, memory',
    desc: 'Enquiries pour in. The agent qualifies buyers over the phone, schedules viewings, shows the property, collects feedback. The verbal feedback after each viewing \u2014 what buyers liked, what concerned them \u2014 is almost never written down.',
  },
  {
    title: 'Offers & Negotiation',
    actor: 'Agent / Owner / Buyers',
    captured: 'Email, phone call, memory',
    desc: 'Offers arrive. The agent assesses each buyer\u2019s financial capacity, recommends one over another, negotiates terms. The reasoning behind \u201cwhy this buyer\u201d lives in the agent\u2019s head.',
    isDecisionGate: true,
  },
  {
    title: 'Contract & Notary',
    actor: 'Agent / Notary / Parties',
    captured: 'Legal docs, email',
    desc: 'The notary drafts the Kaufvertrag. Both parties review. Questions about Grundst\u00fcckgewinnsteuer and completion dates are discussed in meetings that nobody takes notes in. The contract captures the terms \u2014 not the conversations that shaped them.',
    isDecisionGate: true,
  },
  {
    title: 'Closing & Handover',
    actor: 'Agent / Notary / Parties',
    captured: 'Legal docs, bank, memory',
    desc: 'Funds transfer. Grundbuch updated. Keys handed over. The agent does a final walkthrough, notices a few things, decides not to flag them. Commission invoiced. Follow-up calls made. Then the agent moves on to the next deal.',
  },
]

export const BROKERAGE_ITEMS: Item[] = [
  // ── Stage 0: Lead & First Contact ──
  { s:0, t:'information', l:'Lead comes in via website form',       rec:true,  cap:'CRM' },
  { s:0, t:'information', l:'Owner\u2019s contact details',         rec:true,  cap:'CRM' },
  { s:0, t:'task',        l:'Initial call with property owner',     rec:false, cap:'Phone call' },
  { s:0, t:'insight',     l:'Owner is motivated \u2014 relocating for work', rec:false, cap:'Phone call' },
  { s:0, t:'insight',     l:'Owner expects CHF 1.2M \u2014 likely too high', rec:false, cap:'Memory' },
  { s:0, t:'task',        l:'Quick desktop valuation check',        rec:false, cap:'Memory' },
  { s:0, t:'decision',    l:'Decide this lead is worth pursuing',   rec:false, cap:'Memory', r:'Property in target area, owner is motivated, realistic timeline even if price expectation is high' },
  { s:0, t:'task',        l:'Schedule on-site assessment',          rec:true,  cap:'Calendar' },

  // ── Stage 1: Property Assessment ──
  { s:1, t:'task',        l:'Visit the property',                   rec:false, cap:'Memory' },
  { s:1, t:'task',        l:'Walk every room, take photos and notes', rec:true, cap:'Photos' },
  { s:1, t:'task',        l:'Check building condition',             rec:false, cap:'Memory' },
  { s:1, t:'information', l:'Grundbuch (land registry) extract',    rec:true,  cap:'PDF' },
  { s:1, t:'information', l:'Floor plans from owner',               rec:true,  cap:'PDF' },
  { s:1, t:'insight',     l:'Kitchen and bathroom need updating',   rec:false, cap:'Memory' },
  { s:1, t:'insight',     l:'South-facing balcony is the key selling point', rec:false, cap:'Memory' },
  { s:1, t:'information', l:'Owner\u2019s verbal price expectation', rec:false, cap:'Phone call' },
  { s:1, t:'decision',    l:'Price expectation is 10\u201315% too high', rec:false, cap:'Memory', r:'Comparable sales in the Gemeinde suggest CHF 1.05\u20131.1M. Kitchen condition is a factor.' },

  // ── Stage 2: Mandate & Pricing ──
  { s:2, t:'task',        l:'Run hedonic/CMA valuation',            rec:true,  cap:'Platform' },
  { s:2, t:'task',        l:'Pull comparable sales data',           rec:true,  cap:'Platform' },
  { s:2, t:'task',        l:'Analyse local market conditions',      rec:false, cap:'Memory' },
  { s:2, t:'decision',    l:'Recommend asking price of CHF 1.1M',   rec:false, cap:'Memory', r:'Comparables support 1.05\u20131.1M. Going with the top to leave negotiation room.' },
  { s:2, t:'output',      l:'Valuation presentation',               rec:true,  cap:'Slides' },
  { s:2, t:'task',        l:'Present valuation and strategy to owner', rec:false, cap:'Meeting' },
  { s:2, t:'information', l:'Owner pushes back \u2014 wants CHF 1.15M', rec:false, cap:'Meeting' },
  { s:2, t:'decision',    l:'Accept owner\u2019s price, plan to adjust later', rec:false, cap:'Memory', r:'Better to get the mandate than lose the client. Will revisit after 4 weeks if no offers.' },
  { s:2, t:'task',        l:'Negotiate commission at 2.5%',         rec:false, cap:'Phone call' },
  { s:2, t:'output',      l:'Signed mandate agreement (Maklervertrag)', rec:true, cap:'Contract' },
  { s:2, t:'information', l:'Mandate terms and conditions',         rec:true,  cap:'Contract' },

  // ── Stage 3: Listing Preparation ──
  { s:3, t:'task',        l:'Book professional photographer',       rec:true,  cap:'Email' },
  { s:3, t:'task',        l:'Photography session',                  rec:true,  cap:'Photos' },
  { s:3, t:'task',        l:'3D virtual tour capture',              rec:true,  cap:'Platform' },
  { s:3, t:'task',        l:'Virtual staging of empty rooms',       rec:true,  cap:'Platform' },
  { s:3, t:'information', l:'Energy certificate (GEAK)',            rec:true,  cap:'PDF' },
  { s:3, t:'information', l:'Building insurance (Geb\u00e4udeversicherung)', rec:true, cap:'PDF' },
  { s:3, t:'information', l:'Stockwerkeigent\u00fcmer-Reglement',   rec:true,  cap:'PDF' },
  { s:3, t:'decision',    l:'Select which photos to use in listing', rec:false, cap:'Memory', r:'Best angles selected. Excluded the dated kitchen \u2014 will be flagged in viewings anyway.' },
  { s:3, t:'output',      l:'Property description / expos\u00e9 text', rec:true, cap:'Platform' },
  { s:3, t:'task',        l:'Translate description (DE/FR/EN)',     rec:true,  cap:'Platform' },
  { s:3, t:'output',      l:'Digital expos\u00e9 document',         rec:true,  cap:'PDF' },

  // ── Stage 4: Marketing & Go-Live ──
  { s:4, t:'task',        l:'Upload listing to Homegate',           rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'Upload listing to ImmoScout24',        rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'Upload to properti.com',               rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'Social media campaign setup',          rec:true,  cap:'Platform' },
  { s:4, t:'task',        l:'Direct outreach to buyer database',    rec:true,  cap:'CRM' },
  { s:4, t:'decision',    l:'Allocate more budget to social for this demographic', rec:false, cap:'Memory', r:'Target buyer is 35\u201345, dual income. Social performs better than print for this profile.' },
  { s:4, t:'output',      l:'Listing goes live across all channels', rec:true, cap:'Platform' },
  { s:4, t:'information', l:'First 48 hours: 34 enquiries, 8 viewing requests', rec:true, cap:'Platform' },

  // ── Stage 5: Viewings & Enquiries ──
  { s:5, t:'information', l:'Enquiries come in via portals',        rec:true,  cap:'CRM' },
  { s:5, t:'information', l:'Phone calls from interested parties',  rec:false, cap:'Phone call' },
  { s:5, t:'task',        l:'Qualify buyers: budget, financing, timeline', rec:false, cap:'Phone call' },
  { s:5, t:'decision',    l:'Prioritise pre-approved buyers',       rec:false, cap:'Memory', r:'Two pre-approved buyers with matching budget get first viewing slots. Others wait.' },
  { s:5, t:'task',        l:'Schedule and conduct viewings',        rec:true,  cap:'Calendar' },
  { s:5, t:'task',        l:'First on-site viewing',                rec:false, cap:'Memory' },
  { s:5, t:'information', l:'Buyer asks about Nebenkosten (service charges)', rec:false, cap:'Viewing' },
  { s:5, t:'task',        l:'Conduct virtual viewing',              rec:true,  cap:'Platform' },
  { s:5, t:'insight',     l:'Verbal feedback: buyers love the balcony', rec:false, cap:'Memory' },
  { s:5, t:'insight',     l:'Three buyers flagged the kitchen',     rec:false, cap:'Memory' },
  { s:5, t:'insight',     l:'One buyer very interested but wants a second viewing', rec:false, cap:'Phone call' },
  { s:5, t:'output',      l:'Viewing summary report for owner',     rec:true,  cap:'Report' },
  { s:5, t:'decision',    l:'Recommend price reduction after 4 weeks', rec:false, cap:'Memory', r:'Good activity but no offers. Kitchen feedback is consistent. Suggest dropping to CHF 1.1M.' },
  { s:5, t:'information', l:'Owner declines price reduction',       rec:false, cap:'Phone call' },
  { s:5, t:'discarded',   l:'Scratch notes from viewings',          rec:false, cap:'Deleted' },

  // ── Stage 6: Offers & Negotiation ──
  { s:6, t:'information', l:'Offer 1: CHF 1.08M from couple',      rec:true,  cap:'Email' },
  { s:6, t:'information', l:'Offer 2: CHF 1.15M with financing condition', rec:true, cap:'Email' },
  { s:6, t:'task',        l:'Assess buyer 1\u2019s financial capacity', rec:false, cap:'Phone call' },
  { s:6, t:'task',        l:'Verify buyer 2\u2019s mortgage pre-approval', rec:true, cap:'Email' },
  { s:6, t:'decision',    l:'Recommend buyer 1 despite lower price', rec:false, cap:'Memory', r:'Clean financing, no conditions, faster timeline. Buyer 2\u2019s condition creates risk of deal collapse.' },
  { s:6, t:'task',        l:'Present both offers to owner',         rec:true,  cap:'Email' },
  { s:6, t:'information', l:'Owner wants to counter buyer 1',       rec:false, cap:'Phone call' },
  { s:6, t:'task',        l:'Negotiate with buyer 1 \u2014 meet in middle', rec:false, cap:'Phone call' },
  { s:6, t:'decision',    l:'Final price agreed at CHF 1.1M',       rec:true,  cap:'Email', r:'Both parties agreed. Within acceptable range. Owner satisfied, buyer feels they negotiated.' },
  { s:6, t:'task',        l:'Request proof of financing from buyer', rec:true,  cap:'Email' },

  // ── Stage 7: Contract & Notary ──
  { s:7, t:'information', l:'Buyer submits mortgage confirmation',  rec:true,  cap:'Email' },
  { s:7, t:'task',        l:'Instruct notary to draft Kaufvertrag', rec:true,  cap:'Email' },
  { s:7, t:'information', l:'Notary drafts purchase contract',      rec:true,  cap:'Legal doc' },
  { s:7, t:'task',        l:'Review contract with seller',          rec:false, cap:'Meeting' },
  { s:7, t:'information', l:'Seller asks about Grundst\u00fcckgewinnsteuer', rec:false, cap:'Meeting' },
  { s:7, t:'insight',     l:'Tax liability depends on holding period \u2014 owner held 12 years, favourable rate', rec:false, cap:'Meeting' },
  { s:7, t:'task',        l:'Review contract with buyer',           rec:false, cap:'Meeting' },
  { s:7, t:'decision',    l:'Completion date set at 3 months post-signing', rec:false, cap:'Memory', r:'Buyer needs time for mortgage finalisation. Seller needs time to find new place.' },
  { s:7, t:'information', l:'Both parties agree on contract terms',  rec:true,  cap:'Email' },
  { s:7, t:'output',      l:'Signing at notary (Beurkundung)',      rec:true,  cap:'Legal doc' },

  // ── Stage 8: Closing & Handover ──
  { s:8, t:'task',        l:'Notary submits to Grundbuchamt',       rec:true,  cap:'Legal doc' },
  { s:8, t:'information', l:'Buyer\u2019s bank releases funds',     rec:true,  cap:'Bank' },
  { s:8, t:'information', l:'Grundbuch transfer confirmed',         rec:true,  cap:'Land registry' },
  { s:8, t:'task',        l:'Schedule key handover',                rec:true,  cap:'Email' },
  { s:8, t:'task',        l:'Final walkthrough and meter readings',  rec:false, cap:'Memory' },
  { s:8, t:'insight',     l:'Minor crack in bathroom tile \u2014 not in listing photos', rec:false, cap:'Memory' },
  { s:8, t:'decision',    l:'Don\u2019t flag minor issues at handover', rec:false, cap:'Memory', r:'Cosmetic only. Would delay closing unnecessarily and create tension after a smooth process.' },
  { s:8, t:'output',      l:'Handover protocol signed',             rec:true,  cap:'Document' },
  { s:8, t:'output',      l:'Commission invoice sent',              rec:true,  cap:'Email' },
  { s:8, t:'information', l:'Commission received',                  rec:true,  cap:'Bank' },
  { s:8, t:'task',        l:'Follow-up call with seller',           rec:false, cap:'Phone call' },
  { s:8, t:'task',        l:'Follow-up call with buyer',            rec:false, cap:'Phone call' },
  { s:8, t:'discarded',   l:'All informal notes from the deal',     rec:false, cap:'Deleted' },
]
