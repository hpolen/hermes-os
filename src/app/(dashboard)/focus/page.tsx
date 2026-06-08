'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import {
  Target, ChevronLeft, ChevronRight, RefreshCw,
  Layers, CheckCheck, RotateCcw, Bot, Lock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pillar, Initiative, DailyTask } from '@/lib/types'
import { getPillars } from '@/lib/firebase/pillars'
import { getInitiatives } from '@/lib/firebase/initiatives'
import { getDailyTasks, createDailyTask, updateDailyTask, rollTask } from '@/lib/firebase/dailyTasks'
import { TaskInput } from '@/components/focus/TaskInput'
import { TaskItem } from '@/components/focus/TaskItem'
import { DailyProgress } from '@/components/focus/DailyProgress'
import { PillarBadge, getPillarColors } from '@/components/focus/PillarBadge'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const DUMMY_USER = 'joey'

// ─── Initiative sidebar panel ─────────────────────────────────────────────────

function InitiativesPanel({
  pillars,
  initiatives,
  tasks,
}: {
  pillars: Pillar[]
  initiatives: Initiative[]
  tasks: DailyTask[]
}) {
  const [openPillarId, setOpenPillarId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {pillars.map(pillar => {
        const pillarInits = initiatives.filter(i => i.pillarId === pillar.id && i.status === 'active')
        if (pillarInits.length === 0) return null
        const isOpen = openPillarId === pillar.id
        const c = getPillarColors(pillar.color)

        // Count today's tasks linked to any initiative in this pillar
        const linkedToday = tasks.filter(t =>
          t.pillarId === pillar.id && t.initiativeId &&
          (t.status === 'todo' || t.status === 'done')
        ).length

        return (
          <div key={pillar.id} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setOpenPillarId(isOpen ? null : pillar.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/30 ${isOpen ? 'bg-muted/20' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{pillar.emoji}</span>
                <span className="text-xs font-medium">{pillar.name}</span>
                {linkedToday > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} ${c.border} border`}>
                    {linkedToday} today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {pillar.agentEnabled
                  ? <span title="Agent-enabled"><Bot className="w-3 h-3 text-green-400/60" /></span>
                  : <span title="Manual work only"><Lock className="w-3 h-3 text-muted-foreground/40" /></span>}
                <span className="text-[10px] text-muted-foreground">{pillarInits.length}</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border/50 divide-y divide-border/30">
                {pillarInits.map(ini => {
                  const iniTasks = tasks.filter(t => t.initiativeId === ini.id && (t.status === 'todo' || t.status === 'done'))
                  const iniDone = iniTasks.filter(t => t.status === 'done').length
                  return (
                    <div key={ini.id} className="px-3 py-2 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{ini.name}</p>
                        {iniTasks.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{iniDone}/{iniTasks.length}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [date, setDate] = useState(TODAY)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(false)

  // Seed pillars + initiatives on first load
  const ensureSeeded = useCallback(async () => {
    if (seeded) return
    const p = await getPillars()
    if (p.length === 0) {
      await fetch('/api/focus/seed', { method: 'POST' })
    }
    setSeeded(true)
  }, [seeded])

  const load = useCallback(async (d: string) => {
    setLoading(true)
    try {
      await ensureSeeded()
      const [p, i, t] = await Promise.all([
        getPillars(),
        getInitiatives(),
        getDailyTasks(d),
      ])
      setPillars(p)
      setInitiatives(i)
      setTasks(t)
    } finally {
      setLoading(false)
    }
  }, [ensureSeeded])

  useEffect(() => { void load(date) }, [date, load])

  const isToday = date === TODAY

  // ─── Handlers ───────────────────────────────────────────────

  async function handleAddTask(text: string, pillarId: string | null) {
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order), -1)
    const newTask: Omit<DailyTask, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: DUMMY_USER,
      date,
      text,
      status: 'todo',
      order: maxOrder + 1,
      pillarId: pillarId ?? undefined,
      rollCount: 0,
    }
    const id = await createDailyTask(newTask)
    setTasks(prev => [...prev, { ...newTask, id } as DailyTask])
  }

  async function handleComplete(task: DailyTask) {
    setSaving(prev => new Set(prev).add(task.id))
    try {
      const now = new Date()
      await updateDailyTask(task.id, { status: 'done', completedAt: now as unknown as import('@/lib/types').DailyTask['completedAt'] })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' } : t))
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(task.id); return n })
    }
  }

  async function handleRoll(task: DailyTask) {
    const tomorrow = format(addDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd')
    setSaving(prev => new Set(prev).add(task.id))
    try {
      await rollTask(task, tomorrow)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'rolled' } : t))
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(task.id); return n })
    }
  }

  async function handleDrop(task: DailyTask) {
    setSaving(prev => new Set(prev).add(task.id))
    try {
      await updateDailyTask(task.id, { status: 'dropped' })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'dropped' } : t))
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(task.id); return n })
    }
  }

  async function handleAssignPillar(task: DailyTask, pillarId: string | null) {
    await updateDailyTask(task.id, { pillarId: pillarId ?? undefined, initiativeId: undefined })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, pillarId: pillarId ?? undefined, initiativeId: undefined } : t))
  }

  async function handleAssignInitiative(task: DailyTask, initiativeId: string | null) {
    await updateDailyTask(task.id, { initiativeId: initiativeId ?? undefined })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, initiativeId: initiativeId ?? undefined } : t))
  }

  // ─── Derived state ──────────────────────────────────────────

  const activeTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => a.order - b.order)
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => a.order - b.order)
  const inactiveTasks = tasks.filter(t => t.status === 'rolled' || t.status === 'dropped')

  const allActive = [...activeTasks, ...doneTasks]

  function taskPillar(t: DailyTask) { return pillars.find(p => p.id === t.pillarId) }
  function taskInitiative(t: DailyTask) { return initiatives.find(i => i.id === t.initiativeId) }

  const dateLabel = date === TODAY
    ? 'Today'
    : date === format(addDays(new Date(), -1), 'yyyy-MM-dd')
    ? 'Yesterday'
    : format(new Date(date + 'T12:00:00'), 'EEE, MMM d')

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Daily Focus
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your work, your day, your pace</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date nav */}
          <button
            onClick={() => setDate(format(addDays(new Date(date + 'T12:00:00'), -1), 'yyyy-MM-dd'))}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[90px] text-center">{dateLabel}</span>
          <button
            onClick={() => setDate(format(addDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd'))}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(TODAY)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors ml-1"
            >
              Today
            </button>
          )}
          <button
            onClick={() => void load(date)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: main task area */}
        <div className="lg:col-span-2 space-y-4">

          {/* Progress card */}
          {allActive.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <DailyProgress tasks={tasks} pillars={pillars} />
              </CardContent>
            </Card>
          )}

          {/* Task input — only for today */}
          {isToday && (
            <Card>
              <CardContent className="pt-4 pb-4 space-y-3">
                <TaskInput
                  pillars={pillars}
                  selectedPillarId={selectedPillarId}
                  onSelectPillar={setSelectedPillarId}
                  onSubmit={handleAddTask}
                  disabled={loading}
                />
              </CardContent>
            </Card>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Active tasks */}
          {!loading && activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  pillar={taskPillar(task)}
                  initiative={taskInitiative(task)}
                  pillars={pillars}
                  initiatives={initiatives}
                  onComplete={handleComplete}
                  onRoll={handleRoll}
                  onDrop={handleDrop}
                  onAssignPillar={handleAssignPillar}
                  onAssignInitiative={handleAssignInitiative}
                  loading={saving.has(task.id)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {isToday ? (
                <div className="space-y-2">
                  <p className="text-2xl">✏️</p>
                  <p className="text-sm font-medium">Clean slate.</p>
                  <p className="text-xs">Type a task above and hit Enter to start your day.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl">📅</p>
                  <p className="text-sm">No tasks recorded for {dateLabel}.</p>
                </div>
              )}
            </div>
          )}

          {/* Completed tasks */}
          {!loading && doneTasks.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 pt-2">
                <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Completed · {doneTasks.length}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <div className="space-y-1">
                {doneTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    pillar={taskPillar(task)}
                    initiative={taskInitiative(task)}
                    pillars={pillars}
                    initiatives={initiatives}
                    onComplete={handleComplete}
                    onRoll={handleRoll}
                    onDrop={handleDrop}
                    onAssignPillar={handleAssignPillar}
                    onAssignInitiative={handleAssignInitiative}
                    loading={saving.has(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rolled / dropped */}
          {!loading && inactiveTasks.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 pt-1">
                <RotateCcw className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/50 uppercase tracking-wide">
                  Moved / Dropped · {inactiveTasks.length}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="space-y-1">
                {inactiveTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    pillar={taskPillar(task)}
                    initiative={taskInitiative(task)}
                    pillars={pillars}
                    initiatives={initiatives}
                    onComplete={handleComplete}
                    onRoll={handleRoll}
                    onDrop={handleDrop}
                    onAssignPillar={handleAssignPillar}
                    onAssignInitiative={handleAssignInitiative}
                    loading={saving.has(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: initiatives sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Active Initiatives
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : (
                <InitiativesPanel
                  pillars={pillars}
                  initiatives={initiatives}
                  tasks={tasks}
                />
              )}
            </CardContent>
          </Card>

          {/* Pillar legend */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pillars
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-1.5">
                {pillars.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <PillarBadge pillar={p} size="sm" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground font-mono">[{p.shortKey}]</span>
                      {p.agentEnabled
                        ? <span title="Alfred can act on this"><Bot className="w-3 h-3 text-green-400/60" /></span>
                        : <span title="Manual only"><Lock className="w-3 h-3 text-muted-foreground/30" /></span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
