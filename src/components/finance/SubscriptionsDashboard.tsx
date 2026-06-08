'use client'

import { useEffect, useState } from 'react'
import {
  Repeat,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  payee: string
  payeeKey: string
  icon: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual'
  last_charged: string
  next_expected: string
  occurrences: number
  category: string
  total_annual: number
  confidence: 'confirmed' | 'possible'
  status: 'active' | 'possibly_canceled'
  price_changed: boolean
  amounts: number[]
}

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; pill: string }> = {
  Streaming:     { bg: 'bg-indigo-500',  text: 'text-white', pill: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  Music:         { bg: 'bg-pink-500',    text: 'text-white', pill: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  Audio:         { bg: 'bg-teal-500',    text: 'text-white', pill: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  News:          { bg: 'bg-slate-500',   text: 'text-white', pill: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  Fitness:       { bg: 'bg-emerald-500', text: 'text-white', pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  Software:      { bg: 'bg-blue-500',    text: 'text-white', pill: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  Gaming:        { bg: 'bg-purple-500',  text: 'text-white', pill: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  Food:          { bg: 'bg-orange-500',  text: 'text-white', pill: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  Shopping:      { bg: 'bg-amber-500',   text: 'text-white', pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  Education:     { bg: 'bg-cyan-500',    text: 'text-white', pill: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  Entertainment: { bg: 'bg-rose-500',    text: 'text-white', pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  Other:         { bg: 'bg-gray-500',    text: 'text-white', pill: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
}

function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Other']!
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatNextCharge(dateStr: string): { label: string; colorClass: string } {
  const d = daysUntil(dateStr)
  if (d < 0)   return { label: `${Math.abs(d)}d overdue`, colorClass: 'text-rose-400 font-semibold' }
  if (d === 0) return { label: 'Today',    colorClass: 'text-amber-400 font-semibold' }
  if (d === 1) return { label: 'Tomorrow', colorClass: 'text-amber-400 font-semibold' }
  if (d <= 3)  return { label: `in ${d} days`, colorClass: 'text-amber-400 font-semibold' }
  return { label: `in ${d} days`, colorClass: 'text-muted-foreground' }
}

function toMonthlyEquivalent(amount: number, frequency: Subscription['frequency']): number {
  if (frequency === 'weekly')    return amount * 52 / 12
  if (frequency === 'quarterly') return amount / 3
  if (frequency === 'annual')    return amount / 12
  return amount // monthly
}

function freqLabel(frequency: Subscription['frequency']): string {
  return { monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly', annual: 'Annual' }[frequency]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubscriptionRow({
  sub,
  onDismiss,
  showActions,
}: {
  sub: Subscription
  onDismiss?: () => void
  showActions?: boolean
}) {
  const colors = getCategoryColors(sub.category)
  const { label: nextLabel, colorClass: nextColorClass } = formatNextCharge(sub.next_expected)
  const d = daysUntil(sub.next_expected)
  const isUrgent = d >= 0 && d <= 3
  const isCanceled = sub.status === 'possibly_canceled'
  const monthlyEq = toMonthlyEquivalent(sub.amount, sub.frequency)

  return (
    <div
      className={[
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
        isCanceled
          ? 'border-border/50 bg-muted/10 opacity-60'
          : sub.price_changed
          ? 'border-l-2 border-l-amber-500 border-border/60 bg-muted/20 hover:bg-muted/30'
          : 'border-border/60 bg-muted/20 hover:bg-muted/30',
      ].join(' ')}
    >
      {/* Icon circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${colors.bg}`}
        aria-hidden="true"
      >
        {sub.icon}
      </div>

      {/* Middle: name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-sm font-medium truncate ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
            {sub.payee}
          </p>
          {isCanceled && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-gray-500/40 text-gray-400 bg-gray-500/10">
              Inactive?
            </Badge>
          )}
          {sub.price_changed && !isCanceled && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              Price change
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${colors.pill}`}>
            {freqLabel(sub.frequency)}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          {isUrgent && <AlertTriangle className={`w-2.5 h-2.5 ${nextColorClass}`} />}
          <span className={`text-[10px] ${nextColorClass}`}>Next: {nextLabel}</span>
        </div>
        {showActions && (
          <div className="flex gap-1.5 mt-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[9px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              onClick={onDismiss}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[9px] px-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Right: amount */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${isCanceled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {formatUSD(sub.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {sub.frequency !== 'monthly'
            ? `${formatUSD(monthlyEq, 0)}/mo`
            : `${formatUSD(sub.total_annual, 0)}/yr`}
        </p>
      </div>
    </div>
  )
}

function CategoryPills({ subscriptions }: { subscriptions: Subscription[] }) {
  const catTotals = new Map<string, { icon: string; total: number }>()
  for (const sub of subscriptions) {
    if (sub.confidence !== 'confirmed' || sub.status === 'possibly_canceled') continue
    const mo = toMonthlyEquivalent(sub.amount, sub.frequency)
    const existing = catTotals.get(sub.category)
    if (existing) {
      existing.total += mo
    } else {
      catTotals.set(sub.category, { icon: sub.icon, total: mo })
    }
  }
  if (catTotals.size === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {[...catTotals.entries()].map(([cat, { icon, total }]) => {
        const colors = getCategoryColors(cat)
        return (
          <span
            key={cat}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.pill}`}
          >
            <span>{icon}</span>
            <span>{cat}</span>
            <span className="opacity-70">{formatUSD(total, 0)}</span>
          </span>
        )
      })}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 p-2.5">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-14 ml-auto" />
            <Skeleton className="h-3 w-10 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card (local, matches FinanceDashboard pattern) ──────────────────────

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  subtitle?: string
  loading?: boolean
}

function StatCard({ label, value, icon, subtitle, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            )}
            {subtitle && !loading && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function SubscriptionsDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [possibleExpanded, setPossibleExpanded] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/subscriptions', { cache: 'no-store' })
      const data = (await res.json()) as Subscription[] | { error: string }
      if (!res.ok) {
        setError((data as { error: string }).error ?? 'Failed to load')
      } else {
        setSubscriptions(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadOnce() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/finance/subscriptions', { cache: 'no-store' })
        const data = (await res.json()) as Subscription[] | { error: string }
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
    void loadOnce()
    return () => { cancelled = true }
  }, [])

  const confirmed = subscriptions.filter(
    s => s.confidence === 'confirmed' && !dismissed.has(s.payeeKey)
  )
  const possible = subscriptions.filter(
    s => s.confidence === 'possible' && !dismissed.has(s.payeeKey)
  )

  const totalMonthly = confirmed
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency), 0)
  const totalAnnual = totalMonthly * 12

  const urgentCount = confirmed.filter(s => {
    const d = daysUntil(s.next_expected)
    return d >= 0 && d <= 3 && s.status === 'active'
  }).length

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Repeat className="w-5 h-5 text-muted-foreground" />
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recurring charges detected from your transactions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary stat cards */}
      {!loading && !error && subscriptions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Monthly"
            value={formatUSD(totalMonthly, 0)}
            icon={<TrendingDown className="w-4 h-4" />}
            subtitle="Active subscriptions"
          />
          <StatCard
            label="Annual"
            value={formatUSD(totalAnnual, 0)}
            icon={<TrendingUp className="w-4 h-4" />}
            subtitle="Projected yearly total"
          />
          <StatCard
            label="Active"
            value={`${confirmed.filter(s => s.status === 'active').length} confirmed${possible.length > 0 ? ` · ${possible.length} possible` : ''}`}
            icon={<Repeat className="w-4 h-4" />}
            subtitle="Tracked subscriptions"
          />
        </div>
      )}

      {/* Due soon alert */}
      {!loading && urgentCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400 font-medium">
            {urgentCount} subscription{urgentCount > 1 ? 's' : ''} charging in the next 3 days
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <SkeletonRows />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-rose-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && subscriptions.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <CalendarClock className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium text-center">No subscriptions detected yet</p>
          <p className="text-xs opacity-60 text-center">
            Needs at least 2 months of transaction history
          </p>
        </div>
      )}

      {/* Category breakdown */}
      {!loading && !error && confirmed.length > 0 && (
        <CategoryPills subscriptions={subscriptions} />
      )}

      {/* Confirmed subscriptions */}
      {!loading && !error && confirmed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Confirmed Subscriptions
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {confirmed.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {confirmed.map(sub => (
              <SubscriptionRow key={sub.payeeKey} sub={sub} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Possible subscriptions — collapsible */}
      {!loading && !error && possible.length > 0 && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer select-none"
            onClick={() => setPossibleExpanded(v => !v)}
          >
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                Possible Subscriptions
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {possible.length}
                </Badge>
              </span>
              {possibleExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </CardTitle>
          </CardHeader>
          {possibleExpanded && (
            <CardContent className="pb-4 space-y-2 opacity-80">
              {possible.map(sub => (
                <SubscriptionRow
                  key={sub.payeeKey}
                  sub={sub}
                  showActions
                  onDismiss={() =>
                    setDismissed(prev => new Set([...prev, sub.payeeKey]))
                  }
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
