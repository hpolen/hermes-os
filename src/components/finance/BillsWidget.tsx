'use client'

import { useEffect, useState } from 'react'
import { Receipt, CalendarClock, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bill {
  id: string
  payee: string
  icon: string
  category: string
  billType: string
  amount: number
  frequency: 'monthly' | 'annual' | 'variable'
  last_charged: string
  next_due: string
  occurrences: number
  status: 'active' | 'upcoming' | 'due_soon' | 'overdue'
  monthly_amount: number
}

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; pill: string }> = {
  'Auto':          { bg: 'bg-blue-500',    pill: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'Student Loan':  { bg: 'bg-cyan-500',    pill: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  'Housing':       { bg: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'Utilities':     { bg: 'bg-amber-500',   pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'Internet/Phone':{ bg: 'bg-purple-500',  pill: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  'Insurance':     { bg: 'bg-teal-500',    pill: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  'Credit Card':   { bg: 'bg-rose-500',    pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  'Fee':           { bg: 'bg-slate-500',   pill: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
}

function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: 'bg-gray-500', pill: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
}

// ─── Category icon map for summary bar ───────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  'Auto':          '🚗',
  'Student Loan':  '🎓',
  'Housing':       '🏠',
  'Utilities':     '⚡',
  'Internet/Phone':'📡',
  'Insurance':     '🛡️',
  'Credit Card':   '💳',
  'Fee':           '💸',
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

function formatDueDate(dateStr: string): { label: string; colorClass: string } {
  const d = daysUntil(dateStr)
  if (d < 0)   return { label: `${Math.abs(d)}d overdue`,  colorClass: 'text-rose-400 font-semibold' }
  if (d === 0) return { label: 'Due today',               colorClass: 'text-amber-400 font-semibold' }
  if (d === 1) return { label: 'Due tomorrow',            colorClass: 'text-amber-400 font-semibold' }
  if (d <= 7)  return { label: `Due in ${d} days`,        colorClass: 'text-yellow-400' }
  // Format as "Jun 15"
  const date = new Date(dateStr + 'T12:00:00')
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label: `Due ${label}`, colorClass: 'text-muted-foreground' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BillRow({ bill }: { bill: Bill }) {
  const colors = getCategoryColors(bill.category)
  const { label: dueLabel, colorClass: dueColor } = formatDueDate(bill.next_due)
  const isOverdue  = bill.status === 'overdue'
  const isDueSoon  = bill.status === 'due_soon'
  const isUpcoming = bill.status === 'upcoming'

  return (
    <div
      className={[
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
        isOverdue
          ? 'border-l-2 border-l-rose-500 border-border/60 bg-rose-500/5 hover:bg-rose-500/10'
          : isDueSoon
          ? 'border-l-2 border-l-amber-500 border-border/60 bg-amber-500/5 hover:bg-amber-500/10'
          : isUpcoming
          ? 'border-border/60 bg-yellow-500/5 hover:bg-yellow-500/10'
          : 'border-border/60 bg-muted/20 hover:bg-muted/30',
      ].join(' ')}
    >
      {/* Icon circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${colors.bg}`}
        aria-hidden="true"
      >
        {bill.icon}
      </div>

      {/* Middle: name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-medium truncate">{bill.payee}</p>
          {isOverdue && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-500/40 text-rose-400 bg-rose-500/10 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              Overdue
            </Badge>
          )}
          {isDueSoon && !isOverdue && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              Due Soon
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${colors.pill}`}>
            {bill.billType}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <span className={`text-[10px] ${dueColor}`}>{dueLabel}</span>
        </div>
      </div>

      {/* Right: amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatUSD(bill.amount)}
        </p>
        {bill.frequency !== 'monthly' && (
          <p className="text-[10px] text-muted-foreground">
            {formatUSD(bill.monthly_amount, 0)}/mo
          </p>
        )}
        {bill.frequency === 'monthly' && (
          <p className="text-[10px] text-muted-foreground">/mo</p>
        )}
      </div>
    </div>
  )
}

function CategorySummaryBar({ bills }: { bills: Bill[] }) {
  const catTotals = new Map<string, number>()
  for (const bill of bills) {
    const existing = catTotals.get(bill.category) ?? 0
    catTotals.set(bill.category, existing + bill.monthly_amount)
  }
  if (catTotals.size === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {[...catTotals.entries()].map(([cat, total]) => {
        const colors = getCategoryColors(cat)
        const icon = CATEGORY_ICONS[cat] ?? '💰'
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
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-10 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillsWidget() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/finance/bills', { cache: 'no-store' })
        const data = (await res.json()) as Bill[] | { error: string }
        if (cancelled) return
        if (!res.ok) {
          setError((data as { error: string }).error ?? 'Failed to load')
        } else {
          setBills(Array.isArray(data) ? data : [])
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

  const totalMonthly = bills.reduce((sum, b) => sum + b.monthly_amount, 0)
  const urgentCount = bills.filter(b => b.status === 'due_soon' || b.status === 'overdue').length

  return (
    <Card>
      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          Bills &amp; Payments
          {!loading && bills.length > 0 && (
            <Badge
              variant="outline"
              className="ml-auto text-[10px] px-2 py-0 border-border/60 text-foreground bg-muted/30 tabular-nums"
            >
              {formatUSD(totalMonthly, 0)}/mo
            </Badge>
          )}
          {urgentCount > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 flex items-center gap-1"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {urgentCount} urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4 space-y-3">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <p className="text-xs text-rose-400 py-4 text-center">{error}</p>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <CalendarClock className="w-8 h-8 opacity-30" />
            <p className="text-sm text-center">No bills detected</p>
            <p className="text-xs opacity-60 text-center">
              Bills will appear as payments are recognized.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {formatUSD(totalMonthly, 0)}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
                <span className="text-muted-foreground/50 mx-1">·</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatUSD(totalMonthly * 12, 0)}/yr
                </span>
              </div>
              <CategorySummaryBar bills={bills} />
            </div>

            {/* Divider */}
            <div className="border-t border-border/40" />

            {/* Bills list */}
            <div className="space-y-2">
              {bills.map(bill => (
                <BillRow key={bill.id} bill={bill} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
