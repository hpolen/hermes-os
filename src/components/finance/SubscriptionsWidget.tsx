'use client'

import { useEffect, useState } from 'react'
import { Repeat, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  payee: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'annual'
  last_charged: string
  next_expected: string
  occurrences: number
  category: string
  total_annual: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  // Zero out time for day-level comparison
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatRelativeDays(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `in ${d} days`
}

const FREQUENCY_COLORS: Record<string, string> = {
  monthly: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  weekly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  annual: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubscriptionsWidget() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/finance/subscriptions', { cache: 'no-store' })
        const data = await res.json() as Subscription[] | { error: string }
        if (cancelled) return
        if (!res.ok) {
          setError((data as { error: string }).error ?? 'Failed to load')
        } else {
          setSubscriptions(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const totalAnnual = subscriptions.reduce((s, sub) => s + sub.total_annual, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            Subscriptions
          </span>
          {!loading && subscriptions.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-purple-400 border-purple-500/30 bg-purple-500/10"
            >
              {formatUSD(totalAnnual)}/yr
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-rose-400 py-4 text-center">{error}</p>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <CalendarClock className="w-8 h-8 opacity-30" />
            <p className="text-sm">No recurring charges detected</p>
            <p className="text-xs opacity-60">Needs 2+ matching transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub, i) => {
              const freqColorClass = FREQUENCY_COLORS[sub.frequency] ?? FREQUENCY_COLORS.monthly!
              const relDays = daysUntil(sub.next_expected)
              const nextLabel = formatRelativeDays(sub.next_expected)
              const isUrgent = relDays >= 0 && relDays <= 3

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  {/* Frequency dot */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${freqColorClass}`}
                  >
                    {sub.frequency === 'monthly' ? 'Mo' : sub.frequency === 'weekly' ? 'Wk' : 'Yr'}
                  </div>

                  {/* Name + next charge */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.payee}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] ${
                          isUrgent ? 'text-amber-400 font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        Next: {nextLabel}
                      </span>
                      <span className="text-muted-foreground/40 text-[10px]">·</span>
                      <span
                        className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${freqColorClass}`}
                      >
                        {sub.frequency}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatUSD(sub.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatUSD(sub.total_annual)}/yr
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
