'use client'
import { useEffect, useState } from 'react'
import { getTodayStandups } from '@/lib/firebase/standup'
import { StandupEntry } from '@/lib/types'
import { MorningStandup } from './MorningStandup'
import { MiddayCheckin } from './MiddayCheckin'
import { EveningCloseout } from './EveningCloseout'
import { StandupSummary } from './StandupSummary'

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export function StandupRouter() {
  const [standups, setStandups] = useState<StandupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const today = todayDate()

  async function load() {
    try {
      const data = await getTodayStandups(today)
      setStandups(data)
    } catch (err) {
      console.error('Failed to load standups:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [today])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading standup…</p>
      </div>
    )
  }

  const hasMorning = standups.some(s => s.type === 'morning')
  const hasMidday = standups.some(s => s.type === 'midday')
  const hasEvening = standups.some(s => s.type === 'evening')

  // All done
  if (hasMorning && hasMidday && hasEvening) {
    return <StandupSummary standups={standups} date={today} />
  }

  // Evening (17–23)
  if (hour >= 17 && hour <= 23) {
    if (hasMorning && !hasEvening) {
      return <EveningCloseout morningStandup={standups.find(s => s.type === 'morning')} today={today} onComplete={load} />
    }
  }

  // Midday (12–16)
  if (hour >= 12 && hour <= 16) {
    if (hasMorning && !hasMidday) {
      return <MiddayCheckin today={today} onComplete={load} />
    }
  }

  // Morning (5–11)
  if (hour >= 5 && hour <= 11) {
    if (!hasMorning) {
      return <MorningStandup today={today} onComplete={load} />
    }
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-2">
        <p className="text-lg font-semibold">Morning standup done ✅</p>
        <p className="text-muted-foreground">Check back at noon for your midday check-in.</p>
      </div>
    )
  }

  // Default / early AM — show morning standup
  return <MorningStandup today={today} onComplete={load} />
}
