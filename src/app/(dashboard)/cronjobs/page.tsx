'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Timer, RefreshCw, Play, Pause, CheckCircle2,
  AlertCircle, Clock, Send, Calendar, Activity
} from 'lucide-react'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CronJob {
  id: string
  name: string
  schedule: string
  status: 'active' | 'paused'
  lastRun: string | null
  lastStatus: string | null
  nextRun: string | null
  deliver: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_MAP: { prefix: string; label: string; color: string }[] = [
  { prefix: 'monitor-',  label: 'Monitor',  color: 'text-blue-400' },
  { prefix: 'standup-',  label: 'Standup',  color: 'text-green-400' },
  { prefix: 'pkos-',     label: 'PKOS',     color: 'text-violet-400' },
  { prefix: 'joey-',     label: 'Joey',     color: 'text-orange-400' },
  { prefix: 'alfred-',   label: 'Alfred',   color: 'text-sky-400' },
]

function getCategory(name: string): { label: string; color: string } {
  for (const { prefix, label, color } of CATEGORY_MAP) {
    if (name.startsWith(prefix)) return { label, color }
  }
  return { label: 'System', color: 'text-slate-400' }
}

function groupJobs(jobs: CronJob[]): { category: string; color: string; jobs: CronJob[] }[] {
  const groups: Record<string, { color: string; jobs: CronJob[] }> = {}
  for (const job of jobs) {
    const { label, color } = getCategory(job.name)
    if (!groups[label]) groups[label] = { color, jobs: [] }
    groups[label].jobs.push(job)
  }
  const order = ['Monitor', 'Standup', 'PKOS', 'Alfred', 'Joey', 'System']
  return order
    .filter(cat => groups[cat]?.jobs.length)
    .map(cat => ({ category: cat, color: groups[cat].color, jobs: groups[cat].jobs }))
}

/** Convert cron expression or ISO duration string to human-readable label */
function humanSchedule(schedule: string): string {
  const cronMap: Record<string, string> = {
    '0 9 * * *':    'Daily 9:00 AM',
    '0 8 * * *':    'Daily 8:00 AM',
    '0 7 * * *':    'Daily 7:00 AM',
    '0 6 * * *':    'Daily 6:00 AM',
    '30 6 * * *':   'Daily 6:30 AM',
    '55 6 * * *':   'Daily 6:55 AM',
    '0 12 * * *':   'Daily 12:00 PM',
    '0 18 * * *':   'Daily 6:00 PM',
    '0 10 * * 0':   'Sundays 10:00 AM',
    '0 9 * * 0':    'Sundays 9:00 AM',
    '0 8 * * 0':    'Sundays 8:00 AM',
    '0 18 * * 0':   'Sundays 6:00 PM',
    '0 * * * *':    'Every hour',
    '*/30 * * * *': 'Every 30 min',
    '*/15 * * * *': 'Every 15 min',
  }
  if (cronMap[schedule]) return cronMap[schedule]
  // Interval patterns like "every 30m", "every 2h", "every 360m"
  const everyMatch = schedule.match(/^every\s+(\d+)(m|h|d)$/)
  if (everyMatch) {
    const n = parseInt(everyMatch[1])
    const unit = everyMatch[2]
    if (unit === 'm') {
      if (n >= 60 && n % 60 === 0) return `Every ${n / 60}h`
      return `Every ${n} min`
    }
    if (unit === 'h') return `Every ${n}h`
    if (unit === 'd') return `Every ${n} days`
  }
  // Short interval patterns like "30m", "2h"
  const intervalMatch = schedule.match(/^(\d+)(m|h|d)$/)
  if (intervalMatch) {
    const n = intervalMatch[1]
    const unit = intervalMatch[2] === 'm' ? 'min' : intervalMatch[2] === 'h' ? 'hr' : 'day'
    return `Every ${n} ${unit}`
  }
  return schedule
}

function formatRunTime(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return 'Never'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Never'
  }
}

function formatNextRun(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return '—'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  toggling,
  error,
  onToggle,
}: {
  job: CronJob
  toggling: boolean
  error: string | null
  onToggle: (job: CronJob) => void
}) {
  const isActive = job.status === 'active'
  const lastOk = job.lastStatus === 'ok'
  const hasRun = !!job.lastRun

  return (
    <div className={`
      rounded-lg border transition-all
      ${isActive
        ? 'border-border bg-card'
        : 'border-border/50 bg-muted/20 opacity-75'}
    `}>
      <div className="p-4">
        {/* Top row: name + toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status indicator */}
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isActive ? 'bg-green-400' : 'bg-slate-500'
              }`} />
              <span className="font-medium text-sm truncate">{job.name}</span>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{humanSchedule(job.schedule)}</span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <code className="text-[10px] text-muted-foreground/60 bg-muted px-1 py-0.5 rounded">
                {job.schedule}
              </code>
            </div>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => onToggle(job)}
            disabled={toggling}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all flex-shrink-0 border
              ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive
                ? 'bg-muted border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'}
            `}
          >
            {toggling ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isActive ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {toggling ? 'Updating…' : isActive ? 'Pause' : 'Resume'}
          </button>
        </div>

        {/* Bottom row: stats */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {/* Last run */}
          <div className="flex items-center gap-1.5">
            {!hasRun ? (
              <Clock className="w-3 h-3 text-muted-foreground" />
            ) : lastOk ? (
              <CheckCircle2 className="w-3 h-3 text-green-400" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
            <span className="text-xs text-muted-foreground">
              {hasRun ? formatRunTime(job.lastRun) : 'Never run'}
            </span>
          </div>

          {/* Next run */}
          {isActive && job.nextRun && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Next {formatNextRun(job.nextRun)}
              </span>
            </div>
          )}

          {/* Deliver */}
          {job.deliver && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Send className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] font-mono text-muted-foreground/70 truncate max-w-[160px]">
                {job.deliver}
              </span>
            </div>
          )}
        </div>

        {/* Inline error */}
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [jobErrors, setJobErrors] = useState<Record<string, string>>({})

  const fetchJobs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cronjobs')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { jobs: CronJob[]; notice?: string }
      setJobs(data.jobs)
      setNotice(data.notice ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchJobs() }, [fetchJobs])

  const handleToggle = useCallback(async (job: CronJob) => {
    const action = job.status === 'active' ? 'pause' : 'resume'
    const newStatus = action === 'pause' ? 'paused' : 'active'

    // Clear any previous error for this job
    setJobErrors(prev => { const next = { ...prev }; delete next[job.id]; return next })

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus as 'active' | 'paused' } : j))
    setToggling(prev => new Set(prev).add(job.id))

    try {
      const res = await fetch(`/api/cronjobs/${job.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      // Revert + show inline error
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: job.status } : j))
      setJobErrors(prev => ({ ...prev, [job.id]: e instanceof Error ? e.message : String(e) }))
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(job.id); return next })
    }
  }, [])

  const totalActive = jobs.filter(j => j.status === 'active').length
  const totalPaused = jobs.filter(j => j.status === 'paused').length
  const lastRunOk = jobs.filter(j => j.lastStatus === 'ok').length
  const lastRunErr = jobs.filter(j => j.lastStatus && j.lastStatus !== 'ok').length
  const groups = groupJobs(jobs)

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-500" />
            Cron Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Scheduled Alfred automation jobs</p>
        </div>
        <button
          onClick={() => void fetchJobs(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: jobs.length, color: 'text-foreground' },
            { label: 'Active', value: totalActive, color: 'text-green-400' },
            { label: 'Paused', value: totalPaused, color: 'text-slate-400' },
            { label: 'Last run errors', value: lastRunErr, color: lastRunErr > 0 ? 'text-red-400' : 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notice banner (e.g. sync not running) */}
      {notice && (
        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {notice}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Failed to load cron jobs</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchJobs()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map(g => (
            <div key={g} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups */}
      {!loading && !error && (
        <div className="space-y-6">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No cron jobs found.
              </CardContent>
            </Card>
          ) : (
            groups.map(({ category, color, jobs: groupJobs }) => (
              <div key={category} className="space-y-2">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {groupJobs.filter(j => j.status === 'active').length}/{groupJobs.length} active
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Job cards */}
                <div className="space-y-2">
                  {groupJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      toggling={toggling.has(job.id)}
                      error={jobErrors[job.id] ?? null}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
