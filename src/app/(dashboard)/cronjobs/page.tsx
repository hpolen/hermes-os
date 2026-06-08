'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

const CATEGORY_MAP: { prefix: string; label: string }[] = [
  { prefix: 'monitor-', label: 'Hermes Monitor' },
  { prefix: 'standup-', label: 'Standup' },
  { prefix: 'joey-', label: 'Joey' },
  { prefix: 'alfred-', label: 'Alfred' },
]

function getCategory(name: string): string {
  for (const { prefix, label } of CATEGORY_MAP) {
    if (name.startsWith(prefix)) return label
  }
  return 'System'
}

function groupJobs(jobs: CronJob[]): { category: string; jobs: CronJob[] }[] {
  const groups: Record<string, CronJob[]> = {}
  for (const job of jobs) {
    const cat = getCategory(job.name)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(job)
  }
  // Define ordering
  const order = ['Hermes Monitor', 'Standup', 'Joey', 'Alfred', 'System']
  return order
    .filter(cat => groups[cat]?.length)
    .map(cat => ({ category: cat, jobs: groups[cat] }))
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function formatNextRun(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LastRunCell({ lastRun, lastStatus }: { lastRun: string | null; lastStatus: string | null }) {
  const dotColor =
    lastRun === null
      ? 'bg-slate-400'
      : lastStatus === 'ok'
      ? 'bg-green-500'
      : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm text-slate-600">{relativeTime(lastRun)}</span>
    </div>
  )
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cronjobs')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { jobs: CronJob[] }
      setJobs(data.jobs)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchJobs()
  }, [fetchJobs])

  const handleToggle = useCallback(async (job: CronJob) => {
    const action = job.status === 'active' ? 'pause' : 'resume'
    const newStatus = action === 'pause' ? 'paused' : 'active'

    // Optimistic update
    setJobs(prev =>
      prev.map(j => j.id === job.id ? { ...j, status: newStatus as 'active' | 'paused' } : j)
    )
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
      // Revert on error
      setJobs(prev =>
        prev.map(j => j.id === job.id ? { ...j, status: job.status } : j)
      )
      alert(`Failed to ${action} job: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setToggling(prev => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    }
  }, [])

  const totalActive = jobs.filter(j => j.status === 'active').length
  const totalPaused = jobs.filter(j => j.status === 'paused').length
  const groups = groupJobs(jobs)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cron Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your scheduled Alfred jobs</p>
        </div>
        {!loading && !error && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {jobs.length} jobs · {totalActive} active · {totalPaused} paused
          </Badge>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 mb-3">Failed to load cron jobs: {error}</p>
            <Button variant="outline" onClick={() => void fetchJobs()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Jobs table */}
      {!loading && !error && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Deliver</TableHead>
                  <TableHead className="text-right">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(({ category, jobs: groupJobs }) => (
                  <>
                    {/* Group header row */}
                    <TableRow key={`group-${category}`} className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={7} className="py-2 px-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {category}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          ({groupJobs.length})
                        </span>
                      </TableCell>
                    </TableRow>
                    {/* Job rows */}
                    {groupJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium text-slate-800">
                          {job.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {job.schedule}
                          </code>
                        </TableCell>
                        <TableCell>
                          {job.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                              Paused
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <LastRunCell lastRun={job.lastRun} lastStatus={job.lastStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatNextRun(job.nextRun)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500 font-mono">
                            {job.deliver ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={job.status === 'active'}
                            disabled={toggling.has(job.id)}
                            onCheckedChange={() => void handleToggle(job)}
                            aria-label={`Toggle ${job.name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
