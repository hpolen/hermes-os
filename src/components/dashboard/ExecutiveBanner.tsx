'use client'
import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/firebase/projects'
import { getTodayStandups } from '@/lib/firebase/standup'
import { usePortfolioHealth } from '@/hooks/usePortfolioHealth'
import { getTodayString, getWeekLabel } from '@/lib/utils/date'
import { Project, StandupEntry, TIER_LABELS } from '@/lib/types'
import { AlertTriangle, Target, TrendingUp, Calendar } from 'lucide-react'

export function ExecutiveBanner() {
  const [projects, setProjects] = useState<Project[]>([])
  const [standup, setStandup] = useState<StandupEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const health = usePortfolioHealth(projects)

  useEffect(() => {
    async function load() {
      const [projs, standups] = await Promise.all([
        getProjects(),
        getTodayStandups(getTodayString())
      ])
      setProjects(projs)
      const morning = standups.find(s => s.type === 'morning') ?? null
      setStandup(morning)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="h-24 bg-slate-900 rounded-lg animate-pulse" />

  const displayGoals = standup?.topGoals ?? standup?.goals ?? []

  return (
    <div className="bg-slate-900 text-white rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Week + Score */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {getWeekLabel()}
            </p>
            <p className="text-2xl font-bold mt-0.5">
              Portfolio {health.grade}
              <span className="text-sm text-slate-400 font-normal ml-2">{health.score}% healthy</span>
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">● {health.green} green</span>
            <span className="text-yellow-400">● {health.yellow} yellow</span>
            <span className="text-red-400">● {health.red} red</span>
          </div>
        </div>

        {/* Top Priority */}
        {health.topProject && (
          <div className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2">
            <Target className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Top Priority</p>
              <p className="text-sm font-medium">{health.topProject.name}</p>
              <p className="text-xs text-slate-500">{TIER_LABELS[health.topProject.tier]}</p>
            </div>
          </div>
        )}

        {/* Today's Goals */}
        {displayGoals.length > 0 && (
          <div className="flex items-start gap-2 bg-slate-800 rounded px-3 py-2 max-w-xs">
            <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 mb-1">Today&apos;s Goals</p>
              {displayGoals.filter(Boolean).slice(0, 3).map((g, i) => (
                <p key={i} className="text-xs text-slate-300 truncate">• {g}</p>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {health.red > 0 && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-xs text-red-400">Open Risks</p>
              <p className="text-sm font-bold text-red-300">{health.red} project{health.red > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
