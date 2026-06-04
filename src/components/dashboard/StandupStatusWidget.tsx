'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTodayStandups, getStandupHistory } from '@/lib/firebase/standup'
import { StandupEntry } from '@/lib/types'
import { getTodayString } from '@/lib/utils/date'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, CheckCircle2, Circle, Flame } from 'lucide-react'

export function StandupStatusWidget() {
  const [standups, setStandups] = useState<StandupEntry[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()

  useEffect(() => {
    async function load() {
      const [today, history] = await Promise.all([
        getTodayStandups(getTodayString()),
        getStandupHistory(60)
      ])
      setStandups(today)
      // Calculate streak: count consecutive days with evening standup
      let s = 0
      const dates = [...new Set(history.filter(x => x.type === 'evening').map(x => x.date))].sort().reverse()
      const todayStr = getTodayString()
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date()
        expected.setDate(expected.getDate() - i)
        const expectedStr = expected.toISOString().slice(0, 10)
        if (dates[i] === expectedStr || (i === 0 && dates[i] === todayStr)) { s++ } else { break }
      }
      setStreak(s)
      setLoading(false)
    }
    load()
  }, [])

  const hasMorning = standups.some(s => s.type === 'morning')
  const hasMidday = standups.some(s => s.type === 'midday')
  const hasEvening = standups.some(s => s.type === 'evening')

  const items = [
    { label: 'Morning', done: hasMorning, warn: !hasMorning && hour >= 9, time: '7:00 AM' },
    { label: 'Midday', done: hasMidday, warn: !hasMidday && hour >= 13 && hasMorning, time: '12:00 PM' },
    { label: 'Evening', done: hasEvening, warn: !hasEvening && hour >= 18 && hasMorning, time: '6:00 PM' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-green-500" />
          Today's Standup
          {streak > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-orange-500 font-normal">
              <Flame className="w-3.5 h-3.5" /> {streak}d streak
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-9 bg-muted rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Link key={item.label} href="/standup">
                <div className={`flex items-center gap-3 p-2 rounded transition-colors hover:bg-muted ${item.warn ? 'ring-1 ring-red-400 bg-red-50 dark:bg-red-950' : ''}`}>
                  {item.done
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <Circle className={`w-4 h-4 flex-shrink-0 ${item.warn ? 'text-red-400' : 'text-muted-foreground'}`} />
                  }
                  <span className={`text-sm font-medium ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{item.time}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
