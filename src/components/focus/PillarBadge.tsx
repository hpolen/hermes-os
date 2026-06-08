import { Pillar } from '@/lib/types'

// Map pillar color token → actual Tailwind classes
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string; ring: string }> = {
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   dot: 'bg-blue-500',   ring: 'ring-blue-500/40' },
  red:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    dot: 'bg-red-500',    ring: 'ring-red-500/40' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', dot: 'bg-violet-500', ring: 'ring-violet-500/40' },
  sky:    { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/30',    dot: 'bg-sky-500',    ring: 'ring-sky-500/40' },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/30',  dot: 'bg-amber-500',  ring: 'ring-amber-500/40' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  dot: 'bg-green-500',  ring: 'ring-green-500/40' },
  slate:  { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  dot: 'bg-slate-400',  ring: 'ring-slate-500/40' },
}

export function getPillarColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.slate
}

export function PillarBadge({
  pillar,
  size = 'sm',
  showKey = false,
}: {
  pillar: Pillar
  size?: 'xs' | 'sm'
  showKey?: boolean
}) {
  const c = getPillarColors(pillar.color)
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${c.bg} ${c.text} ${c.border}
        ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}
      `}
    >
      {pillar.emoji && <span className="leading-none">{pillar.emoji}</span>}
      {showKey ? pillar.shortKey : pillar.name}
    </span>
  )
}
