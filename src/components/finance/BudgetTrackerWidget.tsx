'use client'

import { useEffect, useState } from 'react'
import { Target, X, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpendingCategory {
  category: string
  total: number
  count: number
}

interface Budget {
  id: string
  category: string
  monthly_limit: number
  created_at: string
  updated_at: string
}

interface BudgetTrackerWidgetProps {
  spending: SpendingCategory[]
  loadingSpending: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

function hashColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return PALETTE[h % PALETTE.length]!
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#f97316',
  'Groceries': '#22c55e',
  'Shopping': '#6366f1',
  'Entertainment': '#ec4899',
  'Travel': '#06b6d4',
  'Transport': '#3b82f6',
  'Health': '#14b8a6',
  'Utilities': '#eab308',
  'Subscriptions': '#8b5cf6',
  'Uncategorized': '#6b7280',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? hashColor(category)
}

const DEFAULT_CATEGORIES = [
  'Food & Drink',
  'Groceries',
  'Shopping',
  'Entertainment',
  'Travel',
  'Transport',
  'Health',
  'Utilities',
  'Subscriptions',
  'Uncategorized',
]

function getBarColor(pct: number): string {
  if (pct >= 100) return 'bg-rose-500'
  if (pct >= 75) return 'bg-amber-500'
  return 'bg-emerald-500'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BudgetTrackerWidget({ spending, loadingSpending }: BudgetTrackerWidgetProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loadingBudgets, setLoadingBudgets] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadBudgets()
  }, [])

  async function loadBudgets() {
    setLoadingBudgets(true)
    try {
      const res = await fetch('/api/finance/budgets', { cache: 'no-store' })
      const data = await res.json() as Budget[] | { error: string }
      setBudgets(Array.isArray(data) ? data : [])
    } catch {
      setBudgets([])
    } finally {
      setLoadingBudgets(false)
    }
  }

  async function handleSave() {
    if (!formCategory || !formAmount) return
    const limit = parseFloat(formAmount)
    if (isNaN(limit) || limit <= 0) return

    setSaving(true)
    try {
      await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: formCategory, monthly_limit: limit }),
      })
      setFormCategory('')
      setFormAmount('')
      setShowForm(false)
      await loadBudgets()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: string) {
    try {
      await fetch(`/api/finance/budgets?category=${encodeURIComponent(category)}`, {
        method: 'DELETE',
      })
      await loadBudgets()
    } catch {
      // ignore
    }
  }

  // Build spending lookup from spending prop
  const spendingMap = Object.fromEntries(spending.map(s => [s.category, s.total]))

  // All available categories for the dropdown
  const extraCategories = spending
    .map(s => s.category)
    .filter(c => !DEFAULT_CATEGORIES.includes(c))
  const allCategories = [...DEFAULT_CATEGORIES, ...extraCategories]

  const isLoading = loadingBudgets

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            Monthly Budgets
          </span>
          {!loadingBudgets && (
            <Badge variant="outline" className="text-[10px]">
              {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <Target className="w-8 h-8 opacity-30" />
            <p className="text-sm">No budgets set yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map(budget => {
              const spent = spendingMap[budget.category] ?? 0
              const pct = budget.monthly_limit > 0
                ? Math.min((spent / budget.monthly_limit) * 100, 100)
                : 0
              const rawPct = budget.monthly_limit > 0
                ? (spent / budget.monthly_limit) * 100
                : 0
              const barColor = getBarColor(rawPct)
              const catColor = getCategoryColor(budget.category)
              const isOver = rawPct >= 100

              return (
                <div key={budget.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="text-xs font-medium truncate">{budget.category}</span>
                      {isOver && (
                        <span className="text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                          Over budget
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {loadingSpending ? (
                        <Skeleton className="h-3 w-20" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatUSD(spent)} of {formatUSD(budget.monthly_limit)}
                        </span>
                      )}
                      <button
                        onClick={() => void handleDelete(budget.category)}
                        className="text-muted-foreground hover:text-rose-400 transition-colors"
                        aria-label={`Delete ${budget.category} budget`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Budget inline form */}
        {showForm ? (
          <div className="border border-border rounded-xl p-3 space-y-3 bg-muted/20 mt-2">
            <p className="text-xs font-semibold text-muted-foreground">New Budget</p>
            <Select value={formCategory} onValueChange={v => setFormCategory(v ?? '')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              placeholder="Monthly limit ($)"
              className="h-8 text-xs"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSave() }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => void handleSave()}
                disabled={saving || !formCategory || !formAmount}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setShowForm(false)
                  setFormCategory('')
                  setFormAmount('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs mt-1"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Budget
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
