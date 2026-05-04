'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useDialKit } from 'dialkit'
import {
  ITEMS as ACQ_ITEMS, STAGES as ACQ_STAGES,
  TYPE_META, CLUSTER_ORDER,
  getStageItems, getStageDecisions, getRunningCounts, getTypeTotals,
  type Item, type ItemType, type Stage, type AiLevel,
} from './data'
import { AM_ITEMS, AM_STAGES } from './data-am'
import { BROKERAGE_ITEMS, BROKERAGE_STAGES } from './data-brokerage'
import { PROPERTI_ITEMS, PROPERTI_STAGES } from './data-properti'

type Mode = 'acquisition' | 'asset-management' | 'brokerage' | 'properti'

const MODE_LABELS: Record<Mode, string> = {
  acquisition: 'Acquisition',
  'asset-management': 'Asset Management',
  brokerage: 'Brokerage',
  properti: 'Properti',
}

const DATASETS: Record<Mode, { items: Item[]; stages: Stage[]; title: string; subtitle: string }> = {
  acquisition: {
    items: ACQ_ITEMS,
    stages: ACQ_STAGES,
    title: 'The Underwriting Journey',
    subtitle: 'From first hearing about a lead via an expos\u00e9 to making the decision to buy it',
  },
  'asset-management': {
    items: AM_ITEMS,
    stages: AM_STAGES,
    title: 'The Asset Management Journey',
    subtitle: 'From closing the deal to managing the asset month to month',
  },
  brokerage: {
    items: BROKERAGE_ITEMS,
    stages: BROKERAGE_STAGES,
    title: 'The Brokerage Journey',
    subtitle: 'From first contact with a property owner to closing and key handover',
  },
  properti: {
    items: PROPERTI_ITEMS,
    stages: PROPERTI_STAGES,
    title: 'The Properti Journey',
    subtitle: 'AI handles 8 of 9 steps. The agent handles the one that matters: trust',
  },
}

/* ── Position helpers ── */
function chronoPositions(items: Item[], pageSp: number) {
  return items.map((_, i) => i * pageSp)
}

function clusterPositions(items: Item[], pageSp: number, groupGap: number) {
  const indexed = items.map((it, i) => ({ type: it.t, idx: i }))
  indexed.sort((a, b) => CLUSTER_ORDER.indexOf(a.type) - CLUSTER_ORDER.indexOf(b.type))
  const positions = new Array<number>(items.length).fill(0)
  let z = 0
  let prev: ItemType | null = null
  for (const { type, idx } of indexed) {
    if (prev && type !== prev) z += groupGap
    positions[idx] = z
    z += pageSp
    prev = type
  }
  return positions
}

const AI_LEVEL_ORDER: AiLevel[] = ['automate', 'augment', 'human']
const AI_LEVEL_DEFAULTS: Record<AiLevel, { bg: string; border: string; label: string }> = {
  automate: { bg: '#2A2A2A', border: '#444', label: 'Automate' },
  augment:  { bg: '#D4A0A0', border: '#B08080', label: 'Augment' },
  human:    { bg: '#2D6B6E', border: '#1F5558', label: 'Agent / Broker' },
}

function aiLevelPositions(items: Item[], stages: Stage[], pageSp: number, groupGap: number) {
  const indexed = items.map((it, i) => ({ aiLevel: stages[it.s]?.aiLevel || 'human', idx: i }))
  indexed.sort((a, b) => AI_LEVEL_ORDER.indexOf(a.aiLevel) - AI_LEVEL_ORDER.indexOf(b.aiLevel))
  const positions = new Array<number>(items.length).fill(0)
  let z = 0
  let prev: AiLevel | null = null
  for (const { aiLevel, idx } of indexed) {
    if (prev && aiLevel !== prev) z += groupGap * 2.5
    positions[idx] = z
    z += pageSp
    prev = aiLevel
  }
  return positions
}

/* ── Border color per type ── */
function borderColor(it: Item) {
  if (it.t === 'information') return '#b0aca6'
  if (it.t === 'task') return '#5a7da6'
  if (it.t === 'insight') return '#a08530'
  if (it.t === 'output') return '#2a6b62'
  if (it.t === 'decision' && it.rec) return '#8a3a5e'
  if (it.t === 'decision') return 'rgba(184,77,122,0.5)'
  return '#4a4a4a'
}

function pageBg(it: Item, stageColor?: string) {
  if (stageColor) return stageColor
  if (it.t === 'discarded') return '#3a3a3a'
  if (it.t === 'decision' && !it.rec) return '#1f1420'
  return TYPE_META[it.t].color
}

function pageBgClustered(it: Item, stages: Stage[], colors: Record<AiLevel, { bg: string }>) {
  const level = stages[it.s]?.aiLevel
  if (level) return colors[level].bg
  return pageBg(it)
}

function borderForStage(stageColor: string) {
  // Darken the stage color slightly for the border
  return stageColor + 'cc'
}

export default function ContextGraph() {
  const [mode, setMode] = useState<Mode>('acquisition')
  const [current, setCurrent] = useState(0)
  const [introVisible, setIntroVisible] = useState(true)
  const [hoveredIntroPage, setHoveredIntroPage] = useState<number | null>(null)
  const [introMounted, setIntroMounted] = useState(false)

  const { items, stages, title, subtitle } = DATASETS[mode]
  const TOTAL_STEPS = mode === 'properti' ? 2 : stages.length + 1

  const allDecisions = useMemo(() => items.filter(it => it.t === 'decision'), [items])
  const totalRecorded = useMemo(() => allDecisions.filter(it => it.rec).length, [allDecisions])
  const typeTotals = useMemo(() => getTypeTotals(items), [items])

  // Reset state when switching modes
  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setCurrent(0)
    setIntroVisible(true)
    setHoveredIntroPage(null)
    setIntroMounted(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setIntroMounted(true)))
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setIntroMounted(true)))
  }, [])

  const params = useDialKit('Stack Controls', {
    'Page Spacing':       [7.6, 1, 12],
    'Group Gap':          [21, 2, 40],
    'Rotate X':           [64, 20, 80],
    'Rotate Z':           [-42, -60, -10],
    'Perspective':        [1400, 400, 3000],
    'Page Width':         [300, 120, 400],
    'Page Height':        [230, 80, 300],
    'Border Width':       [1.9, 0, 3],
    'Border Radius':      [10, 0, 20],
    'Dim Opacity':        [0.08, 0.02, 0.4],
    'Hover Lift':         [6, 0, 12],
    'Hover Push Above':   [3, 0, 10],
    'Hover Push Below':   [2, 0, 10],
    'Hover Duration':     [0.3, 0.05, 0.8],
    'Intro Scale':        [1, 0.4, 1.2],
    'Intro Page Gap':     [4.5, 1, 8],
    'Card Stroke':        [0.8, 0, 2],
  })

  const segColors = useDialKit('Segment Colors', {
    'Automate':           '#2A2A2A',
    'Augment':            '#D4A0A0',
    'Agent / Broker':     '#2D6B6E',
  })

  const aiLevelColors: Record<AiLevel, { bg: string; border: string; label: string }> = useMemo(() => ({
    automate: { bg: segColors['Automate'], border: segColors['Automate'] + '99', label: 'Automate' },
    augment:  { bg: segColors['Augment'], border: segColors['Augment'] + '99', label: 'Augment' },
    human:    { bg: segColors['Agent / Broker'], border: segColors['Agent / Broker'] + '99', label: 'Agent / Broker' },
  }), [segColors])

  const perMode = useDialKit('Per-Mode Overrides', {
    'Stack Offset Y':     [0, -200, 200],
    'Scene Padding Bottom': [80, 0, 200],
    'Max Stack Height':   [400, 150, 600],
  })

  // Max stack height controlled per-mode via DialKit.
  const groupGapTotal = 5 * params['Group Gap']
  const maxZ = perMode['Max Stack Height'] / 0.9
  const effectiveSp = Math.min(params['Page Spacing'], (maxZ - groupGapTotal) / items.length)
  const chronoZ = useMemo(() => chronoPositions(items, effectiveSp), [items, effectiveSp])
  const clusterZ = useMemo(() =>
    mode === 'properti'
      ? aiLevelPositions(items, stages, effectiveSp, params['Group Gap'])
      : clusterPositions(items, effectiveSp, params['Group Gap']),
    [items, stages, effectiveSp, params['Group Gap'], mode])
  const isProperti = mode === 'properti'
  const isClustered = isProperti ? current === 1 : current >= stages.length

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < TOTAL_STEPS) setCurrent(idx)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (introVisible) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIntroVisible(false) }
        return
      }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(current + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, introVisible, goTo])

  const stackTransform = `rotateX(${params['Rotate X']}deg) rotateZ(${params['Rotate Z']}deg)`

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b] text-white font-sans overflow-hidden">
      {/* ── Intro Overlay ── */}
      <div className={`fixed inset-0 bg-[#08090a] z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${introVisible ? '' : 'opacity-0 pointer-events-none'}`}>
        {/* Mode toggle */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-white/[0.04] rounded-md p-0.5 border border-white/[0.06]">
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                mode === m ? 'bg-white/[0.08] text-white' : 'text-[#666] hover:text-[#999]'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-20 px-20">
        {/* Stack with entrance animation */}
        <div className="shrink-0 flex flex-col items-center gap-4" style={{
          opacity: introMounted ? 1 : 0,
          transform: introMounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ perspective: 1400, perspectiveOrigin: '58% 30%', width: 320, height: 380, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 40 }}>
            <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: `${stackTransform} scale(${params['Intro Scale']})`, width: 160, height: 115 }}>
              {(() => {
                // Auto-fit: target ~250px of z-depth so stack stays in view after rotation
                const introSp = Math.min(params['Intro Page Gap'], 250 / items.length)
                return items.map((it, i) => {
                const isHovered = hoveredIntroPage === i
                const h = hoveredIntroPage
                const baseZ = i * introSp
                const offset = h === null ? 0 : isHovered ? params['Hover Lift'] : i > h ? params['Hover Push Above'] : i < h ? -params['Hover Push Below'] : 0
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredIntroPage(i)}
                    onMouseLeave={() => setHoveredIntroPage(null)}
                    style={{
                      position: 'absolute', width: 160, height: 115, left: 0, top: 0, borderRadius: 8,
                      backfaceVisibility: 'hidden',
                      background: pageBg(it, isProperti ? stages[it.s]?.color : undefined),
                      border: `1px solid ${isHovered ? 'rgba(255,255,255,0.25)' : (isProperti && stages[it.s]?.color ? borderForStage(stages[it.s].color!) : borderColor(it))}`,
                      transform: `translate3d(0,0,${baseZ + offset}px)`,
                      transition: `border-color 0.15s ease, transform ${params['Hover Duration']}s cubic-bezier(0.16,1,0.3,1)`,
                    }}
                  />
                )
              })
              })()}
            </div>
          </div>
          {/* Tooltip — positioned outside 3D context so cards can't overlap it */}
          <div className="h-5 flex items-center justify-center relative z-10" style={{
            opacity: hoveredIntroPage !== null ? 1 : 0,
            transition: 'opacity 0.12s ease',
          }}>
            {hoveredIntroPage !== null && hoveredIntroPage < items.length && (
              <span className="text-[11px] text-[#888] flex items-center gap-1.5 bg-[#08090a] px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: TYPE_META[items[hoveredIntroPage].t].color }} />
                {items[hoveredIntroPage].l}
              </span>
            )}
          </div>
        </div>

        {/* Text with staggered entrance */}
        <div className="max-w-[480px] flex flex-col gap-5" style={{
          opacity: introMounted ? 1 : 0,
          transform: introMounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.8s 0.15s cubic-bezier(0.16,1,0.3,1), transform 0.8s 0.15s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <h1 className="text-4xl font-bold tracking-tight leading-tight">{title}</h1>
          <p className="text-[15px] text-[#888] leading-[1.75]">
            {subtitle}, there are <strong className="text-[#ccc]">{stages.length} stages</strong> and <strong className="text-[#ccc]">{items.length} steps</strong>. Each one is shown in the stack in the order it happens.
          </p>
          <p className="text-[15px] text-[#888] leading-[1.75]">
            Some steps gather <strong className="text-[#ccc]">information</strong>. Some are <strong style={{color: TYPE_META.task.color}}>tasks</strong>. Some produce <strong style={{color: TYPE_META.output.color}}>outputs</strong>. A few generate <strong style={{color: TYPE_META.insight.color}}>insights</strong>. And at key moments, <strong style={{color: TYPE_META.decision.color}}>decisions</strong> are made.
          </p>
          <p className="text-[15px] text-[#666] leading-[1.75]">
            Dashed borders mean the step was never captured. Most decisions — and many insights — go unrecorded.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{
                  background: type === 'discarded' ? '#3a3a3a' : meta.color,
                  border: type === 'information' ? '1px solid rgba(255,255,255,0.12)' : type === 'discarded' ? '1px solid #4a4a4a' : undefined,
                }} />
                <span className="text-[11px] text-[#666]">{meta.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setIntroVisible(false)} className="self-start mt-2 px-6 py-2.5 bg-white text-[#08090a] rounded-md text-[13px] font-medium hover:bg-[#e8e8e8] transition-colors duration-150 cursor-pointer">
            Begin the journey
          </button>
        </div>
        </div>{/* close flex row */}
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 min-h-0">
        {/* Stack */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div style={{ perspective: params['Perspective'], perspectiveOrigin: '58% 20%', width: 560, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: perMode['Scene Padding Bottom'] }}>
            <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: `${stackTransform} translateY(${perMode['Stack Offset Y']}px)`, width: params['Page Width'], height: params['Page Height'], transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }}>
              {items.map((it, i) => {
                const z = isClustered ? clusterZ[i] : chronoZ[i]
                const isActive = isClustered || (isProperti && current === 0) || it.s === current
                const stageColor = isProperti ? stages[it.s]?.color : undefined
                const bg = isClustered && isProperti ? pageBgClustered(it, stages, aiLevelColors) : pageBg(it, stageColor)
                const bdr = isProperti && stageColor
                  ? (isClustered ? aiLevelColors[stages[it.s]?.aiLevel || 'human'].border : borderForStage(stageColor))
                  : borderColor(it)
                const stroke = params['Card Stroke']
                return (
                  <div key={i} style={{
                    position: 'absolute', width: params['Page Width'], height: params['Page Height'], left: 0, top: 0,
                    borderRadius: params['Border Radius'],
                    backfaceVisibility: 'hidden',
                    background: bg,
                    border: `${params['Border Width']}px solid ${bdr}`,
                    outline: stroke > 0 ? `${stroke}px solid rgba(255,255,255,0.15)` : undefined,
                    outlineOffset: -stroke,
                    opacity: isActive ? 1 : params['Dim Opacity'],
                    transform: `translate3d(0,0,${z}px) scale(${isActive && !isClustered ? 1.03 : 1})`,
                    transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                    transitionDelay: `${Math.min(i * 6, 300)}ms`,
                  }} />
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-10 flex flex-wrap gap-x-4 gap-y-3">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{
                  background: type === 'discarded' ? '#2a2a2a' : meta.color,
                  border: type === 'information' ? '1px solid rgba(255,255,255,0.15)' : type === 'discarded' ? '1px solid #3a3a3a' : undefined,
                }} />
                <span className="text-[9px] text-[#666] font-medium tracking-wide">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="w-[420px] pt-12 pb-6 pr-12 flex flex-col justify-start overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isClustered
            ? <CombinedContent items={items} stages={stages} allDecisions={allDecisions} totalRecorded={totalRecorded} typeTotals={typeTotals} mode={mode} aiColors={aiLevelColors} />
            : isProperti && current === 0
              ? <PropertiOverview items={items} stages={stages} />
              : <StageContent idx={current} items={items} stages={stages} />
          }
        </div>
      </div>

      {/* Controls */}
      <div className="px-12 pb-6 pt-3 flex items-center gap-3.5 shrink-0">
        <div className="flex bg-white/[0.04] rounded p-0.5 border border-white/[0.06] shrink-0">
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-3 py-1 rounded text-[10px] font-medium transition-colors duration-150 cursor-pointer ${
                mode === m ? 'bg-white/[0.08] text-white' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {m === 'acquisition' ? 'ACQ' : m === 'asset-management' ? 'AM' : m === 'brokerage' ? 'BRK' : 'PRP'}
            </button>
          ))}
        </div>
        <div className="flex-1 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} onClick={() => goTo(i)} className={`h-[3px] rounded-sm flex-1 cursor-pointer transition-all duration-300 ${
              i === current
                ? (i < stages.length && stages[i]?.isDecisionGate ? 'bg-[#c41e6a]' : i >= stages.length ? 'bg-[#0f766e]' : 'bg-white/40')
                : i < current ? 'bg-white/[0.08]' : 'bg-white/[0.07]'
            }`} />
          ))}
        </div>
        <button onClick={() => goTo(current - 1)} disabled={current === 0} className="bg-transparent border border-white/10 text-[#666] px-5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer hover:border-white/20 hover:text-white disabled:opacity-15 disabled:pointer-events-none transition-all">
          &larr; Prev
        </button>
        <button onClick={() => goTo(current + 1)} disabled={current === TOTAL_STEPS - 1} className="bg-transparent border border-white/10 text-[#666] px-5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer hover:border-white/20 hover:text-white disabled:opacity-15 disabled:pointer-events-none transition-all whitespace-nowrap">
          {isProperti && current === 0 ? 'See split \u2192' : current === stages.length - 1 ? 'See full stack \u2192' : 'Next \u2192'}
        </button>
        <span className="text-[9px] text-[#333]">or use arrow keys</span>
      </div>
    </div>
  )
}

/* ── Stage Content ── */
function StageContent({ idx, items: allItems, stages }: { idx: number; items: Item[]; stages: Stage[] }) {
  const st = stages[idx]
  const stageItems = getStageItems(allItems, idx)
  const decisions = getStageDecisions(allItems, idx)
  const dr = getRunningCounts(allItems, idx)

  return (
    <>
      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888] mb-1.5">Stage {idx + 1} of {stages.length}</div>
      <div className={`text-[80px] font-extrabold leading-[0.85] mb-1 tabular-nums ${st.isDecisionGate ? 'text-[#c41e6a]/[0.15]' : 'text-white/[0.06]'}`}>
        {String(idx + 1).padStart(2, '0')}
      </div>
      <div className={`text-2xl font-bold tracking-tight leading-tight mb-1 ${st.isDecisionGate ? 'text-[#e74d8b]' : ''}`}>{st.title}</div>
      <div className="text-[11px] text-[#888] mb-4 flex gap-4 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#888]" />{st.actor}</span>
        <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-sm bg-[#888]" />Captured in: {st.captured}</span>
        {st.hours != null && <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded bg-[#888]" />~{st.hours}h per deal</span>}
      </div>
      <p className="text-[13px] text-[#aaa] leading-[1.7] mb-4">{st.desc}</p>

      {/* Steps table */}
      <div className="mb-4 border border-white/[0.04] rounded-lg overflow-hidden shrink-0">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="text-left text-[#777] font-semibold uppercase tracking-wider px-3 py-2">Step</th>
              <th className="text-left text-[#777] font-semibold uppercase tracking-wider px-3 py-2 w-16">Type</th>
              <th className="text-left text-[#777] font-semibold uppercase tracking-wider px-3 py-2 w-20">Where</th>
              {stageItems.some(it => it.auto) && <th className="text-left text-[#777] font-semibold uppercase tracking-wider px-3 py-2 w-20">Auto</th>}
            </tr>
          </thead>
          <tbody>
            {stageItems.map((it, i) => (
              <tr key={i} className="border-b border-white/[0.02] last:border-0">
                <td className="px-3 py-1.5 text-[#aaa]">{it.l}</td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{
                      background: it.t === 'decision' && !it.rec ? '#1c1018' : it.t === 'discarded' ? '#2a2a2a' : TYPE_META[it.t].color,
                      border: !it.rec ? `1px dashed ${it.t === 'decision' ? 'rgba(196,30,106,0.5)' : 'rgba(255,255,255,0.2)'}` : it.t === 'information' ? '1px solid rgba(255,255,255,0.15)' : undefined,
                    }} />
                    <span className="text-[#999]">{TYPE_META[it.t].label}</span>
                  </span>
                </td>
                <td className={`px-3 py-1.5 ${it.rec ? 'text-[#999]' : 'text-[#B84D7A]'}`}>{it.cap}</td>
                {stageItems.some(x => x.auto) && (
                  <td className="px-3 py-1.5">
                    {it.auto ? (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#3D8B80]/15 text-[#5BB8AA]">{it.auto}</span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#B84D7A]/10 text-[#B84D7A]">Manual</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decisions */}
      {decisions.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-[#888] mb-2 pt-3 border-t border-white/[0.06]">Decisions at this stage</div>
          {decisions.map((d, i) => (
            <div key={i}>
              <div className="flex items-start gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${d.rec ? 'bg-[#c41e6a]' : 'border border-[rgba(196,30,106,0.4)]'}`} />
                <span className={`text-[11px] leading-[1.5] ${d.rec ? 'text-[#d4809e]' : 'text-[#aaa]'}`}>
                  {d.l}
                  <span className={`text-[8px] font-semibold tracking-wider uppercase ml-1 px-1 py-0.5 rounded ${d.rec ? 'text-[#B84D7A] bg-[#B84D7A]/[0.1]' : 'text-[#888] bg-white/[0.04]'}`}>
                    {d.rec ? 'recorded' : 'not recorded'}
                  </span>
                </span>
              </div>
              {d.r && <div className="text-[10px] text-[#999] leading-[1.5] ml-3 pl-2 mb-2 border-l-[1.5px] border-white/[0.06]">{d.r}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="pt-3 border-t border-white/[0.06] flex items-baseline gap-2 mt-1">
        <div className="flex items-baseline gap-0.5 tabular-nums">
          <span className="text-[28px] font-extrabold text-[#B84D7A] leading-none">{dr.recorded}</span>
          <span className="text-[20px] font-light text-[#555] mx-0.5">/</span>
          <span className="text-[28px] font-extrabold text-[#888] leading-none">{dr.made}</span>
        </div>
        <span className="text-[11px] text-[#888] font-medium ml-2">decisions recorded</span>
      </div>
    </>
  )
}

/* ── Combined Content ── */
function CombinedContent({ items, stages, allDecisions, totalRecorded, typeTotals, mode, aiColors }: {
  items: Item[]; stages: Stage[];
  allDecisions: Item[]; totalRecorded: number;
  typeTotals: Partial<Record<ItemType, number>>;
  mode: Mode;
  aiColors: Record<AiLevel, { bg: string; border: string; label: string }>;
}) {
  if (mode === 'properti') return <PropertiCombined items={items} stages={stages} colors={aiColors} />

  const labels = [...CLUSTER_ORDER].reverse().map(type => ({
    type, ...TYPE_META[type], count: typeTotals[type] || 0,
  }))

  return (
    <>
      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888] mb-1.5">Combined View</div>
      <div className="text-[80px] font-extrabold leading-[0.85] mb-1 text-[#3D8B80]/[0.15]">&Sigma;</div>
      <div className="text-2xl font-bold tracking-tight text-[#5BB8AA] mb-4">The Full Stack</div>
      <p className="text-[13px] text-[#aaa] leading-[1.7] mb-4">Pages rearranged by type. The chronological mess becomes a clear composition — and the proportions tell the story.</p>

      <div className="flex flex-col gap-1.5 mb-4">
        {labels.map(l => (
          <div key={l.type} className="flex items-center gap-2.5">
            <div className="w-0.5 shrink-0 rounded" style={{ height: Math.max(14, l.count * 2), background: l.color }} />
            <div>
              <div className="text-[9px] font-bold tracking-[1.5px] uppercase" style={{ color: l.color }}>{l.label}</div>
              <div className="text-[10px] text-[#888]">
                {l.count} steps{l.type === 'decision' && ` — only ${totalRecorded} of ${allDecisions.length} recorded`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/[0.04]">
        <p className="text-xs text-[#aaa] leading-[1.8]"><strong className="text-[#ccc]">{allDecisions.length} decisions</strong> were made across {stages.length} stages.</p>
        <p className="text-xs leading-[1.8]"><span className="text-[#B84D7A] font-semibold">Only {totalRecorded} were formally recorded.</span></p>
        <p className="text-xs text-[#aaa] leading-[1.8]">The other <strong className="text-[#ccc]">{allDecisions.length - totalRecorded}</strong> live in spreadsheets, Slack, email, and someone&rsquo;s memory.</p>
        <p className="text-xs text-[#888] italic mt-1.5">Unless you were in the room, you&rsquo;d never know they happened.</p>
      </div>

      <div className="pt-3 border-t border-white/[0.06] flex items-baseline gap-2 mt-3">
        <div className="flex items-baseline gap-0.5 tabular-nums">
          <span className="text-[28px] font-extrabold text-[#B84D7A] leading-none">{totalRecorded}</span>
          <span className="text-[20px] font-light text-[#555] mx-0.5">/</span>
          <span className="text-[28px] font-extrabold text-[#888] leading-none">{allDecisions.length}</span>
        </div>
        <span className="text-[11px] text-[#888] font-medium ml-2">decisions recorded</span>
      </div>
    </>
  )
}

/* ── Properti Overview: full stack with stage labels ── */
function PropertiOverview({ items, stages }: { items: Item[]; stages: Stage[] }) {
  const totalHours = stages.reduce((sum, st) => sum + (st.hours || 0), 0)
  return (
    <>
      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888] mb-1.5">Full Stack</div>
      <div className="text-2xl font-bold tracking-tight text-white mb-2">The Transaction Today</div>
      <p className="text-[13px] text-[#aaa] leading-[1.7] mb-6">
        {items.length} steps across {stages.length} stages. ~{totalHours} hours from lead to close.
      </p>

      <div className="flex flex-col gap-1 mb-4">
        {[...stages].reverse().map((st, ri) => {
          const si = stages.length - 1 - ri
          const count = items.filter(it => it.s === si).length
          return (
            <div key={si} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: st.color }} />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: st.color }}>
                  {st.title}
                </div>
              </div>
              <div className="text-[10px] text-[#666] tabular-nums shrink-0">
                ~{st.hours}h &middot; {count} steps
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-3 border-t border-white/[0.06]">
        <p className="text-xs text-[#aaa] leading-[1.8]">
          Click <strong className="text-white">Next</strong> to see how this splits into what can be automated, augmented, or must stay human.
        </p>
      </div>
    </>
  )
}

/* ── Properti Combined: Automate / Augment / Human ── */
function PropertiCombined({ items, stages, colors }: { items: Item[]; stages: Stage[]; colors: Record<AiLevel, { bg: string; border: string; label: string }> }) {
  const counts: Record<AiLevel, { items: number; hours: number; stages: string[] }> = {
    automate: { items: 0, hours: 0, stages: [] },
    augment:  { items: 0, hours: 0, stages: [] },
    human:    { items: 0, hours: 0, stages: [] },
  }
  stages.forEach((st, si) => {
    const level = st.aiLevel || 'human'
    const stageItems = items.filter(it => it.s === si).length
    counts[level].items += stageItems
    counts[level].hours += st.hours || 0
    counts[level].stages.push(st.title)
  })

  const totalHours = stages.reduce((sum, st) => sum + (st.hours || 0), 0)

  return (
    <>
      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#888] mb-1.5">Split View</div>
      <div className="text-2xl font-bold tracking-tight text-white mb-2">From Co-Pilot to Autopilot</div>
      <p className="text-[13px] text-[#aaa] leading-[1.7] mb-6">
        {items.length} steps across {stages.length} stages, totalling ~{totalHours} hours per deal. Here&rsquo;s how the work breaks down.
      </p>

      <div className="flex flex-col gap-5 mb-6">
        {AI_LEVEL_ORDER.map(level => {
          const c = counts[level]
          const meta = colors[level]
          const pct = Math.round((c.hours / totalHours) * 100)
          return (
            <div key={level} className="flex items-start gap-3">
              <div className="w-1 shrink-0 rounded-full mt-1" style={{ height: Math.max(20, c.items * 1.5), background: meta.bg === '#2A2A2A' ? '#666' : meta.bg }} />
              <div>
                <div className="text-[11px] font-bold tracking-[1.5px] uppercase mb-0.5" style={{ color: meta.bg === '#2A2A2A' ? '#999' : meta.bg }}>
                  {meta.label}
                </div>
                <div className="text-[10px] text-[#888] mb-1">
                  {c.items} steps &middot; ~{c.hours}h &middot; {pct}% of time
                </div>
                <div className="text-[10px] text-[#666]">
                  {c.stages.join(', ')}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-3 border-t border-white/[0.06]">
        <p className="text-xs text-[#aaa] leading-[1.8]">
          <strong className="text-[#ccc]">65% automated today.</strong> The agent spends 70% of their time on what matters — selling, consulting, building trust.
        </p>
        <p className="text-xs text-[#888] leading-[1.8] mt-1">
          Target: <strong className="text-[#ccc]">90%+ automation.</strong> The last mile is what we&rsquo;re building.
        </p>
      </div>
    </>
  )
}
