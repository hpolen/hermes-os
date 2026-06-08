'use client'
import { useState } from 'react'
import { Check, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { DailyTask, Pillar, Initiative } from '@/lib/types'
import { PillarBadge } from './PillarBadge'

interface TaskItemProps {
  task: DailyTask
  pillar?: Pillar
  initiative?: Initiative
  pillars: Pillar[]
  initiatives: Initiative[]
  onComplete: (task: DailyTask) => void
  onRoll: (task: DailyTask) => void
  onDrop: (task: DailyTask) => void
  onAssignPillar: (task: DailyTask, pillarId: string | null) => void
  onAssignInitiative: (task: DailyTask, initiativeId: string | null) => void
  loading?: boolean
}

export function TaskItem({
  task,
  pillar,
  initiative,
  pillars,
  initiatives,
  onComplete,
  onRoll,
  onDrop,
  onAssignPillar,
  onAssignInitiative,
  loading,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)

  const isDone = task.status === 'done'
  const isRolled = task.status === 'rolled'
  const isDropped = task.status === 'dropped'
  const isInactive = isDone || isRolled || isDropped

  const pillarInitiatives = initiatives.filter(i => i.pillarId === (pillar?.id ?? task.pillarId))

  return (
    <div className={`
      group rounded-lg border transition-all
      ${isDone ? 'border-border/30 bg-muted/10 opacity-60' : ''}
      ${isRolled ? 'border-border/20 bg-muted/5 opacity-40' : ''}
      ${isDropped ? 'border-border/20 bg-muted/5 opacity-30' : ''}
      ${!isInactive ? 'border-border bg-card hover:border-border/80' : ''}
    `}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Complete checkbox */}
        <button
          onClick={() => !isInactive && onComplete(task)}
          disabled={isInactive || loading}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-all
            ${isDone
              ? 'bg-green-500 border-green-500'
              : 'border-muted-foreground/40 hover:border-green-400 hover:bg-green-400/10'}
            ${isInactive && !isDone ? 'opacity-40 cursor-default' : ''}
          `}
        >
          {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        {/* Task text + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`text-sm leading-snug ${isDone ? 'line-through text-muted-foreground' : ''}`}>
              {task.text}
            </span>
            {task.rollCount > 0 && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 flex-shrink-0">
                rolled ×{task.rollCount}
              </span>
            )}
            {isRolled && (
              <span className="text-[10px] text-muted-foreground/50">→ moved to tomorrow</span>
            )}
            {isDropped && (
              <span className="text-[10px] text-muted-foreground/50">dropped</span>
            )}
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {pillar && <PillarBadge pillar={pillar} size="xs" />}
            {initiative && (
              <span className="text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                ↑ {initiative.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions — shown on hover or expanded */}
        {!isInactive && (
          <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Tag / link"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onRoll(task)}
              disabled={loading}
              className="p-1 text-muted-foreground hover:text-amber-400 rounded transition-colors"
              title="Roll to tomorrow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDrop(task)}
              disabled={loading}
              className="p-1 text-muted-foreground hover:text-red-400 rounded transition-colors"
              title="Drop task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded: tag/link panel */}
      {expanded && !isInactive && (
        <div className="px-4 pb-3 pt-0 border-t border-border/40 mt-1 space-y-2">
          {/* Pillar selector */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Pillar</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onAssignPillar(task, null)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                  ${!task.pillarId ? 'bg-muted text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border'}`}
              >
                None
              </button>
              {pillars.map(p => (
                <button
                  key={p.id}
                  onClick={() => onAssignPillar(task, p.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                    ${task.pillarId === p.id ? 'bg-muted text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border'}`}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Initiative selector — only if pillar selected */}
          {task.pillarId && pillarInitiatives.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Initiative</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onAssignInitiative(task, null)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                    ${!task.initiativeId ? 'bg-muted text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border'}`}
                >
                  None
                </button>
                {pillarInitiatives.map(ini => (
                  <button
                    key={ini.id}
                    onClick={() => onAssignInitiative(task, ini.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all
                      ${task.initiativeId === ini.id ? 'bg-muted text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border'}`}
                  >
                    {ini.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
