'use client'
import { useState, FormEvent } from 'react'
import { createStandup } from '@/lib/firebase/standup'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  today: string
  onComplete: () => void
}

export function MiddayCheckin({ today, onComplete }: Props) {
  const { user } = useAuth()
  const [goalsOnTrack, setGoalsOnTrack] = useState<'yes' | 'partially' | 'no' | ''>('')
  const [blockers, setBlockers] = useState('')
  const [adjustments, setAdjustments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !goalsOnTrack) return
    setSubmitting(true)
    try {
      await createStandup({
        userId: user.uid,
        date: today,
        type: 'midday',
        goalsOnTrack,
        newBlockers: blockers || undefined,
        afternoonShift: adjustments || undefined,
      })
      setDone(true)
      onComplete()
    } catch (err) {
      console.error('Failed to submit midday checkin:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-3">
        <h2 className="text-xl font-bold">Midday check-in complete ✅</h2>
        <p className="text-muted-foreground">Stay focused. Check back at 6 PM for your evening closeout.</p>
      </div>
    )
  }

  const trackOptions: { value: 'yes' | 'partially' | 'no'; label: string }[] = [
    { value: 'yes', label: 'On Track' },
    { value: 'partially', label: 'Partially' },
    { value: 'no', label: 'Off Track' },
  ]

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Midday Check-In</h2>
        <p className="text-sm text-muted-foreground">How are your morning goals tracking?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Goals status</label>
          <div className="flex gap-3">
            {trackOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoalsOnTrack(opt.value)}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                  goalsOnTrack === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Any new blockers?</label>
          <textarea
            value={blockers}
            onChange={e => setBlockers(e.target.value)}
            placeholder="Optional"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Afternoon priority shift?</label>
          <textarea
            value={adjustments}
            onChange={e => setAdjustments(e.target.value)}
            placeholder="Optional"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !goalsOnTrack}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {submitting ? 'Saving…' : 'Check In'}
        </button>
      </form>
    </div>
  )
}
