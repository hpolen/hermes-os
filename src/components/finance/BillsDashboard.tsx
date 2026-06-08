'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bill {
  id: string
  name: string
  amount: number
  due_day: number
  category: string
  bill_type: string
  frequency: string
  icon: string
  account: string
  notes: string
  is_active: boolean
  alert_days_before: number
  source: 'manual' | 'auto' | 'suggestion'
  created_at: string
  updated_at: string
  next_due: string
  status: 'overdue' | 'due_soon' | 'upcoming' | 'active'
}

interface Suggestion {
  name: string
  amount: number
  due_day: number
  category: string
  bill_type: string
  frequency: string
  icon: string
  account: string
  notes: string
  alert_days_before: number
}

interface FormState {
  name: string
  amount: string
  due_day: string
  category: string
  bill_type: string
  frequency: string
  icon: string
  account: string
  alert_days_before: string
  notes: string
}

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; pill: string; hex: string }> = {
  'Housing':       { bg: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', hex: '#10b981' },
  'Auto':          { bg: 'bg-blue-500',    pill: 'bg-blue-500/15 text-blue-400 border-blue-500/30',          hex: '#3b82f6' },
  'Student Loan':  { bg: 'bg-cyan-500',    pill: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',          hex: '#06b6d4' },
  'Utilities':     { bg: 'bg-amber-500',   pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       hex: '#f59e0b' },
  'Internet/Phone':{ bg: 'bg-purple-500',  pill: 'bg-purple-500/15 text-purple-400 border-purple-500/30',    hex: '#9333ea' },
  'Insurance':     { bg: 'bg-teal-500',    pill: 'bg-teal-500/15 text-teal-400 border-teal-500/30',          hex: '#14b8a6' },
  'Credit Card':   { bg: 'bg-rose-500',    pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30',          hex: '#f43f5e' },
  'Fee':           { bg: 'bg-slate-500',   pill: 'bg-slate-500/15 text-slate-400 border-slate-500/30',       hex: '#64748b' },
  'Other':         { bg: 'bg-slate-500',   pill: 'bg-slate-500/15 text-slate-400 border-slate-500/30',       hex: '#64748b' },
}

function getCatColors(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Other']!
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  overdue:  { label: 'Overdue',   className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  due_soon: { label: 'Due Soon',  className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  upcoming: { label: 'Upcoming',  className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  active:   { label: 'Active',    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!)
}

function relativeDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `in ${diff} days`
}

const EMPTY_FORM: FormState = {
  name: '',
  amount: '',
  due_day: '1',
  category: 'Other',
  bill_type: 'Other',
  frequency: 'monthly',
  icon: '🧾',
  account: '',
  alert_days_before: '3',
  notes: '',
}

function billToForm(bill: Bill): FormState {
  return {
    name: bill.name,
    amount: String(bill.amount),
    due_day: String(bill.due_day),
    category: bill.category,
    bill_type: bill.bill_type,
    frequency: bill.frequency,
    icon: bill.icon,
    account: bill.account,
    alert_days_before: String(bill.alert_days_before),
    notes: bill.notes,
  }
}

// ─── Add/Edit Form ────────────────────────────────────────────────────────────

interface BillFormProps {
  initial?: FormState
  onSave: (data: FormState) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function BillForm({ initial = EMPTY_FORM, onSave, onCancel, saving }: BillFormProps) {
  const [form, setForm] = useState<FormState>(initial)
  const set = (field: keyof FormState) => (v: string) =>
    setForm(prev => ({ ...prev, [field]: v }))

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Bill Name</label>
          <Input
            placeholder="e.g. Honda Financial"
            value={form.name}
            onChange={e => set('name')(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              placeholder="0.00"
              className="pl-7"
              value={form.amount}
              onChange={e => set('amount')(e.target.value)}
            />
          </div>
        </div>

        {/* Due Day */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Day of Month</label>
          <Input
            type="number"
            min={1}
            max={31}
            placeholder="1–31"
            value={form.due_day}
            onChange={e => set('due_day')(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={form.category} onValueChange={(v: string | null) => v && set('category')(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Housing', 'Auto', 'Student Loan', 'Utilities', 'Internet/Phone', 'Insurance', 'Credit Card', 'Other'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bill Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Bill Type</label>
          <Select value={form.bill_type} onValueChange={(v: string | null) => v && set('bill_type')(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Rent', 'Mortgage', 'Loan', 'Utility', 'Insurance', 'Credit Card', 'Fee', 'Other'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Frequency</label>
          <Select value={form.frequency} onValueChange={(v: string | null) => v && set('frequency')(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Icon */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Icon (emoji)</label>
          <Input
            placeholder="🏠"
            value={form.icon}
            onChange={e => set('icon')(e.target.value)}
          />
        </div>

        {/* Account */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Account</label>
          <Input
            placeholder="e.g. U.S. Bank Checking"
            value={form.account}
            onChange={e => set('account')(e.target.value)}
          />
        </div>

        {/* Alert Days */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Alert X days before due</label>
          <Input
            type="number"
            min={0}
            max={30}
            value={form.alert_days_before}
            onChange={e => set('alert_days_before')(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
          <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <Input
            placeholder="Optional notes…"
            value={form.notes}
            onChange={e => set('notes')(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => void onSave(form)}
          disabled={saving || !form.name || !form.amount}
        >
          {saving ? 'Saving…' : 'Save Bill'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillsDashboard() {
  const [bills, setBills] = useState<Bill[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'upcoming'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // ─── Fetchers ───────────────────────────────────────────────────────────────

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/bills', { cache: 'no-store' })
      const data = await res.json() as Bill[]
      setBills(Array.isArray(data) ? data : [])
    } catch {
      setBills([])
    }
  }, [])

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/bills?suggestions=true', { cache: 'no-store' })
      const data = await res.json() as Suggestion[]
      setSuggestions(Array.isArray(data) ? data : [])
    } catch {
      setSuggestions([])
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchBills(), fetchSuggestions()])
    setLoading(false)
  }, [fetchBills, fetchSuggestions])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function handleSave(form: FormState, billId?: string) {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        amount: parseFloat(form.amount) || 0,
        due_day: parseInt(form.due_day) || 1,
        category: form.category,
        bill_type: form.bill_type,
        frequency: form.frequency,
        icon: form.icon || '🧾',
        account: form.account,
        notes: form.notes,
        is_active: true,
        alert_days_before: parseInt(form.alert_days_before) || 3,
        source: 'manual' as const,
        ...(billId ? { id: billId } : {}),
      }

      const method = billId ? 'PUT' : 'POST'
      await fetch('/api/finance/bills', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setShowAddForm(false)
      setEditingBill(null)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this bill? This cannot be undone.')) return
    await fetch(`/api/finance/bills?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await fetchAll()
  }

  async function handleToggleActive(bill: Bill) {
    await fetch('/api/finance/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bill.id, is_active: !bill.is_active }),
    })
    await fetchBills()
  }

  async function handleAddSuggestion(s: Suggestion) {
    setAddingSuggestion(s.name)
    try {
      await fetch('/api/finance/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...s,
          is_active: true,
          source: 'auto',
        }),
      })
      await fetchAll()
    } finally {
      setAddingSuggestion(null)
    }
  }

  function dismissSuggestion(name: string) {
    setDismissedSuggestions(prev => new Set([...prev, name]))
  }

  // ─── Derived data ────────────────────────────────────────────────────────────

  const activeBills = bills.filter(b => b.is_active)
  const totalMonthly = activeBills.reduce((s, b) => {
    if (b.frequency === 'annual') return s + b.amount / 12
    if (b.frequency === 'quarterly') return s + b.amount / 3
    return s + b.amount
  }, 0)
  const totalAnnual = totalMonthly * 12
  const dueSoonCount = activeBills.filter(b => b.status === 'due_soon' || b.status === 'overdue').length

  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.name))
  const showSuggestionsStrip = showSuggestions && visibleSuggestions.length > 0

  const filteredBills = bills.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false
    return true
  })

  const allCategories = Array.from(new Set(bills.map(b => b.category))).sort()

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            Bills &amp; Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your recurring bills and payment schedule
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowAddForm(v => !v); setEditingBill(null) }}
        >
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </div>

      {/* ── Add Form ── */}
      {showAddForm && !editingBill && (
        <BillForm
          onSave={form => handleSave(form)}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Total</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{formatUSD(totalMonthly)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">recurring expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annual Total</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{formatUSD(totalAnnual)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">per year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Bills</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{activeBills.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{bills.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Soon</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${dueSoonCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {dueSoonCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">overdue or ≤3 days</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Suggestions Strip ── */}
      {showSuggestionsStrip && (
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold text-amber-400">
                  Detected from your transactions ({visibleSuggestions.length})
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setShowSuggestions(false)}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Dismiss all
              </Button>
            </div>
            <CardDescription className="text-xs mt-0.5">
              We noticed these in your transaction history — want to track them?
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {visibleSuggestions.map(s => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 min-w-fit"
                >
                  <span className="text-lg">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[120px]">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{formatUSD(s.amount)}/mo</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 ml-1"
                    disabled={addingSuggestion === s.name}
                    onClick={() => void handleAddSuggestion(s)}
                  >
                    {addingSuggestion === s.name ? '…' : '+ Add'}
                  </Button>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                    onClick={() => dismissSuggestion(s.name)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bills Table ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold">Your Bills</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}
                {filter !== 'all' || categoryFilter !== 'all' ? ' (filtered)' : ''}
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filter} onValueChange={(v: string | null) => v && setFilter(v as typeof filter)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due_soon">Due Soon</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>

              {allCategories.length > 0 && (
                <Select value={categoryFilter} onValueChange={(v: string | null) => v && setCategoryFilter(v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {allCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Receipt className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {bills.length === 0
                  ? 'No bills yet. Add your first bill with the button above.'
                  : 'No bills match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBills.map(bill => {
                const colors = getCatColors(bill.category)
                const statusCfg = STATUS_CONFIG[bill.status]
                const isEditing = editingBill?.id === bill.id

                return (
                  <div key={bill.id}>
                    {/* Row */}
                    <div
                      className={`flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors ${
                        bill.status === 'overdue'
                          ? 'border-l-4 border-l-rose-500'
                          : bill.status === 'due_soon'
                          ? 'border-l-4 border-l-amber-500'
                          : ''
                      } ${!bill.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Icon circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${colors.bg}`}
                      >
                        {bill.icon}
                      </div>

                      {/* Name + account */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bill.name}</p>
                        {bill.account && (
                          <p className="text-xs text-muted-foreground truncate">{bill.account}</p>
                        )}
                      </div>

                      {/* Category badge */}
                      <div className="hidden sm:block shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors.pill}`}>
                          {bill.category}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="text-sm font-bold tabular-nums">{formatUSD(bill.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">{bill.frequency}</p>
                      </div>

                      {/* Due date */}
                      <div className="hidden md:block text-right shrink-0 min-w-[110px]">
                        <p className="text-xs font-medium">Due {ordinal(bill.due_day)}</p>
                        <p className="text-[10px] text-muted-foreground">{relativeDate(bill.next_due)}</p>
                      </div>

                      {/* Status */}
                      <div className="hidden lg:block shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Edit"
                          onClick={() => {
                            setEditingBill(bill)
                            setShowAddForm(false)
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title={bill.is_active ? 'Pause bill' : 'Activate bill'}
                          onClick={() => void handleToggleActive(bill)}
                        >
                          {bill.is_active
                            ? <Eye className="w-3.5 h-3.5" />
                            : <EyeOff className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete bill"
                          onClick={() => void handleDelete(bill.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (isEditing) {
                              setEditingBill(null)
                            } else {
                              setEditingBill(bill)
                              setShowAddForm(false)
                            }
                          }}
                        >
                          {isEditing
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="mt-2 ml-0">
                        <BillForm
                          initial={billToForm(bill)}
                          onSave={form => handleSave(form, bill.id)}
                          onCancel={() => setEditingBill(null)}
                          saving={saving}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
