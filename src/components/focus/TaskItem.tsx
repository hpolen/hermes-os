'use client'
import { useState, useEffect, useRef } from 'react'
import { format, addDays } from 'date-fns'
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
  onUncomplete: (task: DailyTask) => void
  onRoll: (task: DailyTask, toDate: string) => void
  onDelete: (task: DailyTask) => void
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
  onUncomplete,
  onRoll,
  onDelete,
  onAssignPillar,
  onAssignInitiative,
  loading,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showRollPicker, setShowRollPicker] = useState(false)

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const in2Days = format(addDays(new Date(), 2), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(tomorrow)

  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-cancel delete confirmation after 3 seconds
  useEffect(() => {
    if (confirmDelete) {
      confirmTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    }
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    }
  }, [confirmDelete])

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
          onClick={() => {
            if (isDone) {
              onUncomplete(task)
            } else if (!isInactive) {
              onComplete(task)
            }
          }}
          disabled={(isInactive && !isDone) || loading}
          title={isDone ? 'Mark incomplete' : 'Mark complete'}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-all
            ${isDone
              ? 'bg-green-500 border-green-500 hover:bg-green-600 cursor-pointer'
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
              <span className="text-[10px] text-muted-foreground/50">→ moved</span>
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

        {/* Actions — shown on hover or when a panel is open */}
        {!isInactive && (
          <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${expanded || showRollPicker || confirmDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Tag / link"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Roll button */}
            <button
              onClick={() => {
                setShowRollPicker(v => !v)
                setSelectedDate(tomorrow)
              }}
              disabled={loading}
              className="p-1 text-muted-foreground hover:text-amber-400 rounded transition-colors"
              title="Roll to date"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Delete button / confirmation */}
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => { onDelete(task); setConfirmDelete(false) }}
                  className="px-1.5 py-0.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="p-1 text-muted-foreground hover:text-red-400 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Roll date picker panel */}
      {showRollPicker && !isInactive && (
        <div className="px-4 pb-3 pt-0 border-t border-border/40 mt-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Roll to</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedDate(tomorrow)}
              className={`text-[10px] px-2 py-1 rounded border transition-all ${selectedDate === tomorrow ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-border/50 text-muted-foreground hover:border-border'}`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setSelectedDate(in2Days)}
              className={`text-[10px] px-2 py-1 rounded border transition-all ${selectedDate === in2Days ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-border/50 text-muted-foreground hover:border-border'}`}
            >
              In 2 days
            </button>
            <input
              type="date"
              min={tomorrow}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-[10px] px-2 py-1 rounded border border-border/50 bg-background text-foreground focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={() => { onRoll(task, selectedDate); setShowRollPicker(false) }}
              disabled={loading || !selectedDate}
              className="text-[10px] px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-colors font-medium disabled:opacity-50"
            >
              Roll ↺
            </button>
            <button
              onClick={() => setShowRollPicker(false)}
              className="text-[10px] px-2 py-1 rounded border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
