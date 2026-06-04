'use client'
import { useState, useEffect, FormEvent } from 'react'
import { getProjects } from '@/lib/firebase/projects'
import { createStandup } from '@/lib/firebase/standup'
import { logTimelineEvent } from '@/lib/firebase/timeline'
import { Project } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  today: string
  onComplete: () => void
}

export function MorningStandup({ today, onComplete }: Props) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState(['', '', ''])
  const [projectId, setProjectId] = useState('')
  const [blockers, setBlockers] = useState('')
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submittedGoals, setSubmittedGoals] = useState<string[]>([])

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error)
  }, [])

  function setGoal(index: number, value: string) {
    const updated = [...goals]
    updated[index] = value
    setGoals(updated)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const topGoals = goals.filter(g => g.trim() !== '')
      await createStandup({
        userId: user.uid,
        date: today,
        type: 'morning',
        goals: topGoals,
        projectId: projectId || undefined,
        blockers: blockers || undefined,
        energyLevel,
      })
      if (projectId) {
        await logTimelineEvent(
          projectId,
          'standup_morning',
          `Morning standup: ${topGoals.join(', ')}`
        )
      }
      setSubmittedGoals(topGoals)
      setDone(true)
      onComplete()
    } catch (err) {
      console.error('Failed to submit standup:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-4">
        <h2 className="text-xl font-bold">Day locked in 🔒</h2>
        <p className="text-muted-foreground">Your top goals for today:</p>
        <ul className="space-y-2">
          {submittedGoals.map((g, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-blue-500 font-bold">{i + 1}.</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">Check back at noon for your midday check-in.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Morning Standup</h2>
        <p className="text-sm text-muted-foreground">Lock in your focus for {today}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Top 3 Goals</label>
          {goals.map((g, i) => (
            <input
              key={i}
              type="text"
              value={g}
              onChange={e => setGoal(i, e.target.value)}
              placeholder={`Goal ${i + 1}`}
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Primary Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select a project (optional)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Blockers (optional)</label>
          <textarea
            value={blockers}
            onChange={e => setBlockers(e.target.value)}
            placeholder="Anything blocking your progress?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Energy Level</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setEnergyLevel(n)}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                  energyLevel === n
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || goals.every(g => !g.trim())}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {submitting ? 'Saving…' : 'Lock In My Day'}
        </button>
      </form>
    </div>
  )
}
