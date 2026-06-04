'use client'
import { useState, FormEvent } from 'react'
import { createStandup } from '@/lib/firebase/standup'
import { StandupEntry } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  morningStandup: StandupEntry | undefined
  today: string
  onComplete: () => void
}

export function EveningCloseout({ morningStandup, today, onComplete }: Props) {
  const { user } = useAuth()
  const morningGoals = morningStandup?.goals ?? []
  const [goalsCompleted, setGoalsCompleted] = useState<boolean[]>(
    morningGoals.map(() => false)
  )
  const [whatMoved, setWhatMoved] = useState('')
  const [carryover, setCarryover] = useState('')
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function toggleGoal(index: number) {
    const updated = [...goalsCompleted]
    updated[index] = !updated[index]
    setGoalsCompleted(updated)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await createStandup({
        userId: user.uid,
        date: today,
        type: 'evening',
        goalsCompleted,
        whatMoved: whatMoved || undefined,
        carryover: carryover || undefined,
        reflection: reflection || undefined,
      })
      setDone(true)
      onComplete()
    } catch (err) {
      console.error('Failed to submit evening closeout:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-3">
        <h2 className="text-xl font-bold">Day closed out 🌙</h2>
        <p className="text-muted-foreground">Great work today. Rest well.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Evening Closeout</h2>
        <p className="text-sm text-muted-foreground">Close out your day for {today}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {morningGoals.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Goals completed?</label>
            <div className="space-y-2">
              {morningGoals.map((goal, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goalsCompleted[i] ?? false}
                    onChange={() => toggleGoal(i)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm">{goal}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">What moved today?</label>
          <textarea
            value={whatMoved}
            onChange={e => setWhatMoved(e.target.value)}
            placeholder="What did you actually accomplish?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">What carries to tomorrow?</label>
          <textarea
            value={carryover}
            onChange={e => setCarryover(e.target.value)}
            placeholder="Items rolling to tomorrow"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">One reflection note</label>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="What did you learn or notice today?"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {submitting ? 'Saving…' : 'Close Out My Day'}
        </button>
      </form>
    </div>
  )
}
