import { DailyTask, Pillar } from '@/lib/types'
import { getPillarColors } from './PillarBadge'

interface DailyProgressProps {
  tasks: DailyTask[]
  pillars: Pillar[]
}

export function DailyProgress({ tasks, pillars }: DailyProgressProps) {
  const active = tasks.filter(t => t.status === 'todo' || t.status === 'done')
  const done = active.filter(t => t.status === 'done')
  const total = active.length
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0

  // Breakdown by pillar
  const pillarBreakdown = pillars.map(p => {
    const pillarTasks = active.filter(t => t.pillarId === p.id)
    const pillarDone = pillarTasks.filter(t => t.status === 'done')
    return { pillar: p, total: pillarTasks.length, done: pillarDone.length }
  }).filter(x => x.total > 0)

  const untagged = active.filter(t => !t.pillarId)

  return (
    <div className="space-y-3">
      {/* Main progress */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold">{done.length}<span className="text-muted-foreground text-base font-normal">/{total}</span></p>
          <p className="text-xs text-muted-foreground">tasks completed today</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{pct}<span className="text-muted-foreground text-base font-normal">%</span></p>
          <p className="text-xs text-muted-foreground">done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct === 100 ? 'bg-green-500' : pct > 60 ? 'bg-blue-500' : pct > 30 ? 'bg-amber-500' : 'bg-muted-foreground/40'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pillar breakdown */}
      {pillarBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {pillarBreakdown.map(({ pillar, total: t, done: d }) => {
            const c = getPillarColors(pillar.color)
            return (
              <div key={pillar.id} className={`flex items-center gap-1.5 text-[10px] rounded-full px-2 py-0.5 border ${c.bg} ${c.border}`}>
                <span>{pillar.emoji}</span>
                <span className={c.text}>{d}/{t}</span>
              </div>
            )
          })}
          {untagged.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] rounded-full px-2 py-0.5 border border-border/40 bg-muted/30">
              <span className="text-muted-foreground">{untagged.filter(t=>t.status==='done').length}/{untagged.length} untagged</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
