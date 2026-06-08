'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  WifiOff,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NetWorthWidget } from '@/components/finance/NetWorthWidget'
import { SubscriptionsWidget } from '@/components/finance/SubscriptionsWidget'
import { BudgetTrackerWidget } from '@/components/finance/BudgetTrackerWidget'
import { BillsWidget } from '@/components/finance/BillsWidget'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  org_name: string
  currency: string
  balance: string
  available_balance: string
  balance_date: string
  type: string | null
  is_manual: boolean
  is_liability: boolean
  is_hidden: boolean
}

interface Transaction {
  id: string
  account_id: string
  posted: string
  transacted_at: string
  amount: string
  description: string
  payee: string | null
  memo: string | null
  category: string
  category_color: string | null
}

interface SpendingCategory {
  category: string
  total: number
  count: number
}

interface SyncStatus {
  last_sync_at: string | null
  age_hours: number | null
  sync_in_progress: boolean
}

interface ApiError {
  error: string
  offline?: boolean
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

function formatDate(dateStr: string, long = false): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(long ? { year: 'numeric' } : {}),
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return 'Unknown'
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

// Deterministic color from string hash
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

function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return {
    start: start.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
    end: end.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
  }
}

function getDaysAgoRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 3600 * 1000)
  return {
    start: start.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
    end: end.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
  }
}

// ─── Offline Banner ───────────────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <WifiOff className="w-12 h-12 text-slate-400" />
      <div>
        <h2 className="text-lg font-semibold text-foreground">Awaiting first sync</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Your financial data is being synced. Alfred runs an automatic sync every 6 hours —
          or trigger one manually from your local machine.
        </p>
      </div>
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 font-mono text-left max-w-sm">
        <div className="text-muted-foreground/70 mb-1"># Force sync now (local machine)</div>
        <div>goetta-finance sync</div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  positive?: boolean | null
  loading?: boolean
  subtitle?: string
}

function StatCard({ label, value, icon, positive, loading, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <p
                className={`text-2xl font-bold tabular-nums ${
                  positive === true
                    ? 'text-emerald-500'
                    : positive === false
                    ? 'text-rose-500'
                    : 'text-foreground'
                }`}
              >
                {value}
              </p>
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

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: Account }) {
  const balance = parseFloat(account.balance)
  const isNegative = balance < 0
  const initials = getInitials(account.org_name || account.name)
  const color = hashColor(account.org_name || account.id)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
      {/* Institution logo placeholder */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{account.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{account.org_name}</span>
          {account.is_manual && (
            <Badge variant="outline" className="text-[10px] h-4">Manual</Badge>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
          {formatUSD(balance)}
        </p>
        {account.balance_date && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatDate(account.balance_date)}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Spending Chart ───────────────────────────────────────────────────────────

interface SpendingChartProps {
  data: SpendingCategory[]
  loading: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { category: string; total: number } }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium">{item.payload.category}</p>
      <p className="text-sm font-bold">{formatUSD(item.payload.total)}</p>
    </div>
  )
}

function SpendingChart({ data, loading }: SpendingChartProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <ArrowUpDown className="w-8 h-8 opacity-30" />
        <p className="text-sm">No spending data this period</p>
      </div>
    )
  }

  // Show top 8, group rest as "Other"
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const top = sorted.slice(0, 8)
  const rest = sorted.slice(8)
  const otherTotal = rest.reduce((s, c) => s + c.total, 0)

  const chartData = [
    ...top.map(c => ({ ...c, category: c.category || 'Uncategorized' })),
    ...(otherTotal > 0 ? [{ category: 'Other', total: otherTotal, count: rest.length }] : []),
  ]

  const totalSpend = chartData.reduce((s, c) => s + c.total, 0)

  return (
    <div className="space-y-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="total"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getCategoryColor(entry.category)}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {chartData.map(item => {
          const pct = totalSpend > 0 ? (item.total / totalSpend) * 100 : 0
          return (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getCategoryColor(item.category) }}
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">{item.category}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
              <span className="text-xs font-medium tabular-nums w-20 text-right">
                {formatUSD(item.total)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sync Status Card ─────────────────────────────────────────────────────────

interface SyncCardProps {
  status: SyncStatus | null
  loading: boolean
  accountCount: number
  onSync: () => void
  syncing: boolean
  error: string | null
}

function SyncCard({ status, loading, accountCount, onSync, syncing, error }: SyncCardProps) {
  const ageHours = status?.age_hours ?? null
  const freshness =
    ageHours === null
      ? 'unknown'
      : ageHours < 2
      ? 'fresh'
      : ageHours < 12
      ? 'stale'
      : 'old'

  const freshnessConfig = {
    fresh: { color: 'text-emerald-500', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Up to date' },
    stale: { color: 'text-amber-500', icon: <Clock className="w-3.5 h-3.5" />, label: 'Slightly stale' },
    old: { color: 'text-rose-500', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Outdated' },
    unknown: { color: 'text-muted-foreground', icon: <Clock className="w-3.5 h-3.5" />, label: 'Unknown' },
  }[freshness]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Data Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <p className="text-xs text-rose-500">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Last sync</p>
                <p className="font-medium">
                  {status?.last_sync_at ? formatRelativeTime(status.last_sync_at) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Accounts</p>
                <p className="font-medium">{accountCount}</p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 text-xs ${freshnessConfig.color}`}>
              {freshnessConfig.icon}
              <span>{freshnessConfig.label}</span>
              {ageHours !== null && (
                <span className="text-muted-foreground">
                  ({ageHours < 1 ? '<1h' : `${Math.round(ageHours)}h`} old)
                </span>
              )}
            </div>

            {status?.sync_in_progress && (
              <p className="text-xs text-blue-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sync in progress…
              </p>
            )}
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onSync}
          disabled={syncing || status?.sync_in_progress === true}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Transactions Table ───────────────────────────────────────────────────────

const PAGE_SIZE = 20

interface TransactionsTableProps {
  transactions: Transaction[]
  accounts: Account[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

function TransactionsTable({ transactions, accounts, loading, error, onRetry }: TransactionsTableProps) {
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'all'>('30d')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, dateRange, categoryFilter, accountFilter])

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  // Build category list
  const categories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).sort()

  // Filter
  const now = Date.now()
  const dayMs = 86400000
  const cutoff =
    dateRange === '30d' ? now - 30 * dayMs :
    dateRange === '90d' ? now - 90 * dayMs :
    0

  const filtered = transactions.filter(t => {
    if (cutoff > 0) {
      const d = new Date(t.transacted_at || t.posted).getTime()
      if (d < cutoff) return false
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (accountFilter !== 'all' && t.account_id !== accountFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const match =
        (t.payee?.toLowerCase().includes(q) ?? false) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageSlice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search payee, description…"
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={dateRange} onValueChange={v => setDateRange(v as '30d' | '90d' | 'all')}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accountFilter} onValueChange={v => setAccountFilter(v ?? 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map(a => (
              <SelectItem key={a.id} value={a.id}>
                {a.name.length > 25 ? a.name.slice(0, 25) + '…' : a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Search className="w-8 h-8 opacity-30" />
          <p className="text-sm font-medium">No transactions found</p>
          <p className="text-xs">Try adjusting your filters or date range</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Payee</TableHead>
                  <TableHead className="text-xs font-semibold">Category</TableHead>
                  <TableHead className="text-xs font-semibold hidden xl:table-cell">Account</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageSlice.map(txn => {
                  const amount = parseFloat(txn.amount)
                  const isIncome = amount > 0
                  const acct = accountMap[txn.account_id]
                  const payee = txn.payee || txn.description
                  const catColor = getCategoryColor(txn.category)

                  return (
                    <TableRow key={txn.id} className="text-sm">
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(txn.transacted_at || txn.posted)}
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <p className="truncate font-medium text-sm">{payee}</p>
                        {txn.memo && (
                          <p className="text-[10px] text-muted-foreground truncate">{txn.memo}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                          style={{ backgroundColor: catColor + 'cc' }}
                        >
                          {txn.category}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[140px]">
                        <p className="truncate">{acct?.name ?? txn.account_id}</p>
                      </TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums text-sm ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : ''}{formatUSD(amount)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function FinanceDashboard() {
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [spending, setSpending] = useState<SpendingCategory[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  // Loading state
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [loadingSpending, setLoadingSpending] = useState(true)
  const [loadingSync, setLoadingSync] = useState(true)

  // Error state
  const [errorAccounts, setErrorAccounts] = useState<string | null>(null)
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null)
  const [errorSpending, setErrorSpending] = useState<string | null>(null)
  const [errorSync, setErrorSync] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Sync state
  const [syncing, setSyncing] = useState(false)

  const hasMounted = useRef(false)

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    setErrorAccounts(null)
    try {
      const res = await fetch('/api/finance/accounts', { cache: 'no-store' })
      const data = await res.json() as Account[] | ApiError
      if (!res.ok) {
        const err = data as ApiError
        if (err.offline) setIsOffline(true)
        setErrorAccounts(err.error)
      } else {
        setAccounts(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setErrorAccounts(e instanceof Error ? e.message : 'Failed to load accounts')
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    setErrorTransactions(null)
    try {
      const res = await fetch('/api/finance/transactions?limit=500', { cache: 'no-store' })
      const data = await res.json() as Transaction[] | ApiError
      if (!res.ok) {
        const err = data as ApiError
        if (err.offline) setIsOffline(true)
        setErrorTransactions(err.error)
      } else {
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setErrorTransactions(e instanceof Error ? e.message : 'Failed to load transactions')
    } finally {
      setLoadingTransactions(false)
    }
  }, [])

  const fetchSpending = useCallback(async () => {
    setLoadingSpending(true)
    setErrorSpending(null)
    try {
      const { start, end } = getMonthRange()
      const params = new URLSearchParams({ start, end })
      const res = await fetch(`/api/finance/spending?${params}`, { cache: 'no-store' })
      const data = await res.json() as SpendingCategory[] | ApiError
      if (!res.ok) {
        const err = data as ApiError
        if (err.offline) setIsOffline(true)
        setErrorSpending(err.error)
      } else {
        setSpending(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setErrorSpending(e instanceof Error ? e.message : 'Failed to load spending')
    } finally {
      setLoadingSpending(false)
    }
  }, [])

  const fetchSyncStatus = useCallback(async () => {
    setLoadingSync(true)
    setErrorSync(null)
    try {
      const res = await fetch('/api/finance/sync', { cache: 'no-store' })
      const data = await res.json() as SyncStatus | ApiError
      if (!res.ok) {
        const err = data as ApiError
        if (err.offline) setIsOffline(true)
        setErrorSync(err.error)
      } else {
        setSyncStatus(data as SyncStatus)
      }
    } catch (e) {
      setErrorSync(e instanceof Error ? e.message : 'Failed to load sync status')
    } finally {
      setLoadingSync(false)
    }
  }, [])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await fetch('/api/finance/sync', { method: 'POST', cache: 'no-store' })
      await Promise.all([fetchAccounts(), fetchTransactions(), fetchSpending(), fetchSyncStatus()])
    } catch {
      // errors handled inside individual fetchers
    } finally {
      setSyncing(false)
    }
  }, [fetchAccounts, fetchTransactions, fetchSpending, fetchSyncStatus])

  useEffect(() => {
    if (hasMounted.current) return
    hasMounted.current = true
    void Promise.all([
      fetchAccounts(),
      fetchTransactions(),
      fetchSpending(),
      fetchSyncStatus(),
    ])
  }, [fetchAccounts, fetchTransactions, fetchSpending, fetchSyncStatus])

  // ─── Computed summary stats ────────────────────────────────────────────────

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0)

  const { start: monthStart, end: monthEnd } = getMonthRange()
  const { start: startMs, end: endMs } = {
    start: new Date(monthStart).getTime(),
    end: new Date(monthEnd).getTime(),
  }

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.transacted_at || t.posted).getTime()
    return d >= startMs && d <= endMs
  })

  const monthlySpending = monthlyTransactions
    .filter(t => parseFloat(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0)

  const monthlyIncome = monthlyTransactions
    .filter(t => parseFloat(t.amount) > 0)
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const netCashFlow = monthlyIncome - monthlySpending

  // ─── Offline check ─────────────────────────────────────────────────────────

  if (isOffline) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-semibold">Finance</h1>
        </div>
        <OfflineBanner />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const anyLoading = loadingAccounts || loadingTransactions

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            Finance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your money, at a glance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void Promise.all([fetchAccounts(), fetchTransactions(), fetchSpending(), fetchSyncStatus()])}
          disabled={anyLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── A. Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatUSD(totalBalance)}
          icon={<Wallet className="w-4 h-4" />}
          positive={totalBalance >= 0 ? true : false}
          loading={loadingAccounts}
          subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Monthly Spending"
          value={formatUSD(monthlySpending)}
          icon={<TrendingDown className="w-4 h-4" />}
          positive={false}
          loading={loadingTransactions}
          subtitle="This month"
        />
        <StatCard
          label="Monthly Income"
          value={formatUSD(monthlyIncome)}
          icon={<TrendingUp className="w-4 h-4" />}
          positive={true}
          loading={loadingTransactions}
          subtitle="This month"
        />
        <StatCard
          label="Net Cash Flow"
          value={formatUSD(netCashFlow)}
          icon={<ArrowUpDown className="w-4 h-4" />}
          positive={netCashFlow >= 0 ? true : false}
          loading={loadingTransactions}
          subtitle="Income − spending"
        />
      </div>

      {/* ── B. Net Worth ── */}
      <NetWorthWidget accounts={accounts} loading={loadingAccounts} />

      {/* ── C. Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Left 60% */}
        <div className="xl:col-span-3 space-y-6">

          {/* Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Accounts
              </CardTitle>
              <CardDescription className="text-xs">
                {accounts.length} connected account{accounts.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {loadingAccounts ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : errorAccounts ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <p className="text-sm text-muted-foreground">{errorAccounts}</p>
                  <Button variant="outline" size="sm" onClick={() => void fetchAccounts()}>Retry</Button>
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No accounts found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accounts.filter(a => !a.is_hidden).map(a => (
                    <AccountCard key={a.id} account={a} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Tracker */}
          <BudgetTrackerWidget spending={spending} loadingSpending={loadingSpending} />

          {/* Bills & Payments */}
          <BillsWidget />

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Transactions</CardTitle>
              <CardDescription className="text-xs">
                {transactions.length} total loaded
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <TransactionsTable
                transactions={transactions}
                accounts={accounts}
                loading={loadingTransactions}
                error={errorTransactions}
                onRetry={() => void fetchTransactions()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right 40% */}
        <div className="xl:col-span-2 space-y-5">

          {/* Spending by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                Spending by Category
              </CardTitle>
              <CardDescription className="text-xs">This month</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {errorSpending ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <p className="text-sm text-muted-foreground">{errorSpending}</p>
                  <Button variant="outline" size="sm" onClick={() => void fetchSpending()}>Retry</Button>
                </div>
              ) : (
                <SpendingChart data={spending} loading={loadingSpending} />
              )}
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <SubscriptionsWidget />

          {/* Sync Status */}
          <SyncCard
            status={syncStatus}
            loading={loadingSync}
            accountCount={accounts.length}
            onSync={() => void handleSync()}
            syncing={syncing}
            error={errorSync}
          />
        </div>
      </div>
    </div>
  )
}
