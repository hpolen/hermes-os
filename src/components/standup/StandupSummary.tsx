'use client'
import { useEffect, useState } from 'react'
import { getStandupHistory } from '@/lib/firebase/standup'
import { StandupEntry } from '@/lib/types'

interface Props {
  standups: StandupEntry[]
  date: string
}

function computeStreak(history: StandupEntry[]): number {
  // Get unique dates that have an evening standup, sorted descending
  const eveningDates = [
    ...new Set(
      history
        .filter(s => s.type === 'evening')
        .map(s => s.date)
    ),
  ].sort((a, b) => b.localeCompare(a))

  let streak = 0
  const today = new Date()
  for (let i = 0; i < eveningDates.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]
    if (eveningDates[i] === expectedStr) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function StandupSummary({ standups, date }: Props) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    getStandupHistory(90)
      .then(history => setStreak(computeStreak(history)))
      .catch(console.error)
  }, [])

  const morning = standups.find(s => s.type === 'morning')
  const evening = standups.find(s => s.type === 'evening')

  const goals = morning?.goals ?? []
  const completed = evening?.goalsCompleted ?? []
  const completedCount = completed.filter(Boolean).length

  return (
    <div className="max-w-lg mx-auto py-10 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Great work today 🎉</h2>
        <p className="text-muted-foreground text-sm mt-1">{date}</p>
      </div>

      {streak > 0 && (
        <div className="flex items-center gap-2 text-lg font-semibold text-orange-500">
          🔥 {streak} day streak
        </div>
      )}

      {goals.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">
            Goals: <span className="text-blue-600">{completedCount} of {goals.length} completed</span>
          </p>
          <ul className="space-y-2">
            {goals.map((goal, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={completed[i] ? 'text-green-500' : 'text-muted-foreground'}>
                  {completed[i] ? '✅' : '⬜'}
                </span>
                <span className={completed[i] ? '' : 'text-muted-foreground line-through'}>{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evening?.reflection && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Reflection</p>
          <p className="text-sm">{evening.reflection}</p>
        </div>
      )}

      {evening?.whatMoved && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What moved</p>
          <p className="text-sm">{evening.whatMoved}</p>
        </div>
      )}
    </div>
  )
}
