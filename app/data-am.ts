/* ═══════════════════════════════════════
   CONTEXT GRAPH — ASSET MANAGEMENT DATA

   The AM journey starts at due diligence (overlapping
   with acquisition), through onboarding, then one
   full monthly operational cycle.

   Two phases:
   1. Transaction & Onboarding (Stages 0-4) — one-time
   2. Monthly Operations (Stages 5-9) — recurring cycle
   ═══════════════════════════════════════ */

import type { Item, Stage } from './data'

export const AM_STAGES: Stage[] = [
  // ── Phase 1: Transaction & Onboarding ──
  {
    title: 'Due Diligence',
    actor: 'Analyst / Legal',
    captured: 'Data room, legal memos',
    desc: 'The data room opens. Hundreds of documents to review — leases, technical reports, environmental assessments, financials. The analyst and lawyers work through it, building a picture that exists mostly in their heads.',
  },
  {
    title: 'Closing & Handover',
    actor: 'Analyst / Fund ops',
    captured: 'Legal docs, email',
    desc: 'Contracts signed, funds wired, ownership transferred. The seller\u2019s team hands over contacts and contracts. A meeting happens. Most of what\u2019s said in that meeting is never written down.',
  },
  {
    title: 'Business Plan Setup',
    actor: 'Asset manager',
    captured: 'Excel, slides',
    desc: 'The underwriting model becomes a Year 1 business plan. Renovation timelines, target rents, capex phasing — all decided now. The model captures the numbers. The reasoning behind each assumption lives in someone\u2019s head.',
  },
  {
    title: 'Accounting & System Setup',
    actor: 'Asset manager / Finance',
    captured: 'Accounting system, Excel',
    desc: 'The property enters the accounting system. Chart of accounts mapped, budget uploaded, reporting templates configured. The PM\u2019s categories don\u2019t match yours — someone manually maps them. That mapping is never documented.',
  },
  {
    title: 'PM Onboarding',
    actor: 'Asset manager',
    captured: 'Email, phone call',
    desc: 'First call with the property manager. Share the business plan, agree on reporting format, set approval thresholds. Most of it agreed verbally. The PM\u2019s understanding of your expectations is based on a 30-minute call.',
  },
  // ── Phase 2: Monthly Operations ──
  {
    title: 'Receive PM Report',
    actor: 'Property manager \u2192 Asset manager',
    captured: 'Email, Excel, PDF',
    desc: 'The monthly package arrives from the property manager. Rent roll, financials, bank statements, maintenance invoices, vacancy update. Sometimes complete. Sometimes not. You won\u2019t know until you open it.',
  },
  {
    title: 'Question & Validate',
    actor: 'Asset manager',
    captured: 'Phone call, email, memory',
    desc: 'You call the PM. Why is this number different? Where\u2019s the HVAC invoice? A tenant paid late? Most answers come over the phone and are never written down. The validation happens in your head.',
  },
  {
    title: 'Map & Process',
    actor: 'Asset manager / Finance',
    captured: 'Excel, accounting system',
    desc: 'The PM\u2019s data gets translated into your world. Their categories become your chart of accounts. Actuals entered, bank reconciled, variances calculated. The reclassification logic lives in someone\u2019s head.',
  },
  {
    title: 'Analyse & Insight',
    actor: 'Asset manager',
    captured: 'Excel, memory',
    desc: 'You compare actuals to budget, spot trends, assess renovation progress. The numbers go into a spreadsheet. The interpretation — why occupancy dipped, whether the rent uplift strategy is working — mostly stays in your head.',
  },
  {
    title: 'Fund Reporting',
    actor: 'Asset manager / Fund ops',
    captured: 'Report, slides, email',
    desc: 'Everything rolls up into fund-level reports. You decide what to flag, what to explain, what to leave out. The investor sees polished numbers. The hundred small decisions behind them are invisible.',
  },
]

export const AM_ITEMS: Item[] = [
  // ── Stage 0: Due Diligence ──
  { s:0, t:'information', l:'Data room access granted',             rec:true,  cap:'Data room' },
  { s:0, t:'task',        l:'Legal review of lease agreements',     rec:true,  cap:'Legal memo' },
  { s:0, t:'information', l:'Technical inspection report',          rec:true,  cap:'PDF' },
  { s:0, t:'information', l:'Environmental assessment',             rec:true,  cap:'PDF' },
  { s:0, t:'task',        l:'Financial audit of rent roll',         rec:true,  cap:'Excel' },
  { s:0, t:'task',        l:'Review PM\u2019s historical reporting',rec:false, cap:'Memory' },
  { s:0, t:'insight',     l:'Discrepancy in reported vs actual vacancy', rec:false, cap:'Memory' },
  { s:0, t:'insight',     l:'Lease break clause in unit 12',       rec:true,  cap:'Legal memo' },
  { s:0, t:'decision',    l:'DD findings don\u2019t change the thesis', rec:false, cap:'Memory', r:'Issues are manageable within existing capex budget. No structural red flags.' },
  { s:0, t:'decision',    l:'Negotiate \u20ac50K reduction for facade', rec:false, cap:'Memory', r:'Structural survey revealed more work than expected. Seller motivated enough to concede.' },
  { s:0, t:'output',      l:'DD summary report',                   rec:true,  cap:'Report' },

  // ── Stage 1: Closing & Handover ──
  { s:1, t:'task',        l:'Final price negotiation',             rec:false, cap:'Phone call' },
  { s:1, t:'information', l:'Closing documents signed',            rec:true,  cap:'Legal docs' },
  { s:1, t:'information', l:'Funds transferred',                   rec:true,  cap:'Bank' },
  { s:1, t:'information', l:'Ownership transfer recorded',         rec:true,  cap:'Land registry' },
  { s:1, t:'task',        l:'Handover meeting with seller\u2019s team', rec:false, cap:'Meeting' },
  { s:1, t:'information', l:'PM contact details and contracts',    rec:true,  cap:'Email' },
  { s:1, t:'insight',     l:'Seller\u2019s AM team flags ongoing boiler issue', rec:false, cap:'Meeting' },
  { s:1, t:'decision',    l:'Retain current property manager',     rec:false, cap:'Memory', r:'PM knows the building. Switching would cause 3-month disruption during renovation.' },
  { s:1, t:'output',      l:'Closing memo',                        rec:true,  cap:'Report' },
  { s:1, t:'discarded',   l:'Handover meeting notes (never written up)', rec:false, cap:'Memory' },

  // ── Stage 2: Business Plan Setup ──
  { s:2, t:'task',        l:'Convert UW model to Year 1 business plan', rec:true, cap:'Excel' },
  { s:2, t:'task',        l:'Set renovation timeline and phases',  rec:false, cap:'Memory' },
  { s:2, t:'task',        l:'Define target rents by unit type',    rec:true,  cap:'Excel' },
  { s:2, t:'decision',    l:'Leasing strategy: 15% uplift on turnover', rec:false, cap:'Memory', r:'Market rents support it. Aggressive but achievable given renovation quality.' },
  { s:2, t:'decision',    l:'Capex phasing: facade first, then interiors', rec:false, cap:'Memory', r:'Facade is deteriorating faster. Interior renos can happen on unit turnover.' },
  { s:2, t:'decision',    l:'Hold 3 months of vacancy reserve',    rec:false, cap:'Memory', r:'Conservative assumption during reno period. Not in the UW model, added post-close.' },
  { s:2, t:'output',      l:'Business plan document',              rec:true,  cap:'Slides' },
  { s:2, t:'output',      l:'Year 1 budget',                       rec:true,  cap:'Excel' },

  // ── Stage 3: Accounting & System Setup ──
  { s:3, t:'task',        l:'Set up property in accounting system', rec:true,  cap:'Accounting system' },
  { s:3, t:'task',        l:'Map chart of accounts',               rec:true,  cap:'Excel' },
  { s:3, t:'task',        l:'Configure reporting templates',       rec:true,  cap:'Accounting system' },
  { s:3, t:'task',        l:'Upload budget into system',           rec:true,  cap:'Accounting system' },
  { s:3, t:'task',        l:'Map PM\u2019s CoA to yours',          rec:false, cap:'Memory', },
  { s:3, t:'decision',    l:'Monthly reporting with quarterly deep dive', rec:false, cap:'Email', r:'Standard for assets this size. PM agreed on a call.' },
  { s:3, t:'discarded',   l:'CoA mapping notes (never formalised)', rec:false, cap:'Memory' },

  // ── Stage 4: PM Onboarding ──
  { s:4, t:'task',        l:'Introductory call with PM',           rec:false, cap:'Phone call' },
  { s:4, t:'task',        l:'Share business plan and targets',     rec:true,  cap:'Email' },
  { s:4, t:'information', l:'PM asks questions about reno scope',  rec:false, cap:'Phone call' },
  { s:4, t:'decision',    l:'Agree on reporting format',           rec:false, cap:'Email', r:'PM\u2019s standard template is close enough. Minor adjustments agreed verbally.' },
  { s:4, t:'decision',    l:'PM approval threshold set at \u20ac5K', rec:false, cap:'Memory', r:'Standard threshold. Discussed but never put in writing.' },
  { s:4, t:'task',        l:'Set up shared folder for documents',  rec:true,  cap:'Cloud drive' },
  { s:4, t:'discarded',   l:'Verbal agreements from onboarding call', rec:false, cap:'Memory' },

  // ── Stage 5: Receive PM Report ──
  { s:5, t:'information', l:'Monthly financial report arrives',    rec:true,  cap:'Email' },
  { s:5, t:'information', l:'Rent roll spreadsheet',               rec:true,  cap:'Excel' },
  { s:5, t:'information', l:'Bank statements',                     rec:true,  cap:'PDF' },
  { s:5, t:'information', l:'Maintenance invoice pack',            rec:true,  cap:'PDF' },
  { s:5, t:'information', l:'Vacancy and leasing update',          rec:true,  cap:'Email' },
  { s:5, t:'information', l:'Tenant complaint (mentioned on call)', rec:false, cap:'Phone call' },
  { s:5, t:'task',        l:'Review completeness of report',       rec:false, cap:'Memory' },
  { s:5, t:'insight',     l:'Maintenance section missing HVAC costs', rec:false, cap:'Memory' },
  { s:5, t:'task',        l:'Email PM about missing HVAC line',    rec:true,  cap:'Email' },
  { s:5, t:'decision',    l:'Report complete enough to proceed',   rec:false, cap:'Memory', r:'HVAC costs expected next month. Will reconcile then rather than delay.' },

  // ── Stage 6: Question & Validate ──
  { s:6, t:'task',        l:'Call PM about rent collection discrepancy', rec:false, cap:'Phone call' },
  { s:6, t:'insight',     l:'One tenant paid late \u2014 shows next month', rec:false, cap:'Phone call' },
  { s:6, t:'task',        l:'Verify maintenance costs against budget', rec:true, cap:'Excel' },
  { s:6, t:'task',        l:'Question \u20ac8K plumbing invoice',   rec:false, cap:'Phone call' },
  { s:6, t:'information', l:'PM sends backup invoice from contractor', rec:true, cap:'Email' },
  { s:6, t:'task',        l:'Cross-reference bank vs PM figures',  rec:true,  cap:'Excel' },
  { s:6, t:'insight',     l:'\u20ac2.3K unreconciled amount found', rec:true,  cap:'Excel' },
  { s:6, t:'decision',    l:'Plumbing cost is legitimate',         rec:false, cap:'Memory', r:'PM provided contractor quote and photos. Aligned with building age and condition.' },
  { s:6, t:'decision',    l:'Flag unreconciled amount for next month', rec:false, cap:'Memory', r:'Likely timing difference on a bank transfer. Not worth escalating yet.' },

  // ── Stage 7: Map & Process ──
  { s:7, t:'task',        l:'Map PM data to your chart of accounts', rec:true, cap:'Excel' },
  { s:7, t:'task',        l:'Reclassify PM\u2019s "general maintenance"', rec:false, cap:'Memory' },
  { s:7, t:'task',        l:'Enter actuals into accounting system', rec:true,  cap:'Accounting system' },
  { s:7, t:'task',        l:'Reconcile bank vs PM',                rec:true,  cap:'Excel' },
  { s:7, t:'task',        l:'Calculate monthly NOI',               rec:true,  cap:'Excel' },
  { s:7, t:'task',        l:'Run variance analysis: actual vs budget', rec:true, cap:'Excel' },
  { s:7, t:'insight',     l:'Maintenance 22% over budget',         rec:true,  cap:'Excel' },
  { s:7, t:'decision',    l:'Reclassify facade inspection as capex', rec:false, cap:'Memory', r:'Extends building life. Should be capitalised per fund accounting policy, not expensed.' },
  { s:7, t:'output',      l:'Monthly management accounts',         rec:true,  cap:'Excel' },

  // ── Stage 8: Analyse & Insight ──
  { s:8, t:'insight',     l:'Occupancy dipped from 96% to 93%',   rec:true,  cap:'Excel' },
  { s:8, t:'task',        l:'Compare rent collection to business plan', rec:true, cap:'Excel' },
  { s:8, t:'insight',     l:'Renovation 2 weeks behind schedule',  rec:false, cap:'Phone call' },
  { s:8, t:'task',        l:'Calculate projected year-end NOI',    rec:true,  cap:'Excel' },
  { s:8, t:'insight',     l:'Rent uplift on renewals tracking below target', rec:false, cap:'Memory' },
  { s:8, t:'decision',    l:'Bring forward marketing for vacant units', rec:false, cap:'Memory', r:'Occupancy dipping. Need to fill before winter slow season hits.' },
  { s:8, t:'decision',    l:'Don\u2019t adjust business plan yet', rec:false, cap:'Memory', r:'Only 1 month of data. Need 3 months to see a real trend before revising.' },
  { s:8, t:'output',      l:'Asset performance summary',           rec:true,  cap:'Report' },
  { s:8, t:'discarded',   l:'Scratch scenario: what if reno takes 6 more months?', rec:false, cap:'Deleted' },

  // ── Stage 9: Fund Reporting ──
  { s:9, t:'task',        l:'Consolidate asset into portfolio report', rec:true, cap:'Excel' },
  { s:9, t:'task',        l:'Write narrative for asset performance', rec:true, cap:'Report' },
  { s:9, t:'decision',    l:'What to flag to fund manager',        rec:false, cap:'Memory', r:'Maintenance overrun is explainable. Renovation delay is more concerning \u2014 flag that.' },
  { s:9, t:'task',        l:'Prepare investor update materials',   rec:true,  cap:'Slides' },
  { s:9, t:'output',      l:'NAV calculation inputs',              rec:true,  cap:'Excel' },
  { s:9, t:'output',      l:'Investor quarterly report',           rec:true,  cap:'PDF' },
  { s:9, t:'information', l:'Fund manager asks about reno delay',  rec:false, cap:'Phone call' },
  { s:9, t:'insight',     l:'Delay is permitting, not execution',  rec:false, cap:'Phone call' },
  { s:9, t:'decision',    l:'Include reno timeline in next investor letter', rec:false, cap:'Memory', r:'Transparency is better. Investors appreciate proactive communication.' },
  { s:9, t:'task',        l:'Submit reports',                      rec:true,  cap:'Email' },
]
