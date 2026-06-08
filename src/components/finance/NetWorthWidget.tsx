'use client'

import { Scale, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

interface NetWorthWidgetProps {
  accounts: Account[]
  loading: boolean
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

// ─── Component ────────────────────────────────────────────────────────────────

export function NetWorthWidget({ accounts, loading }: NetWorthWidgetProps) {
  const visible = accounts.filter(a => !a.is_hidden)

  const assetAccounts = visible.filter(a => !a.is_liability)
  const liabilityAccounts = visible.filter(a => a.is_liability)

  const assets = assetAccounts.reduce((s, a) => {
    const b = parseFloat(a.balance)
    return s + (b > 0 ? b : 0)
  }, 0)

  const liabilities = liabilityAccounts.reduce((s, a) => {
    return s + Math.abs(parseFloat(a.balance))
  }, 0)

  const netWorth = assets - liabilities
  const isPositive = netWorth >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Scale className="w-4 h-4 text-muted-foreground" />
          Net Worth
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 space-y-5">
        {/* Big net worth number */}
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <p
            className={`text-3xl font-bold tabular-nums ${
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatUSD(netWorth)}
          </p>
        )}

        {/* Assets / Liabilities sub-stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Assets</p>
              {loading ? (
                <Skeleton className="h-5 w-24 mt-0.5" />
              ) : (
                <p className="text-sm font-semibold tabular-nums text-emerald-500">
                  {formatUSD(assets)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Liabilities</p>
              {loading ? (
                <Skeleton className="h-5 w-24 mt-0.5" />
              ) : (
                <p className="text-sm font-semibold tabular-nums text-rose-500">
                  {formatUSD(liabilities)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account breakdown: Assets | Liabilities */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border">
            {/* Assets column */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Assets
              </p>
              {assetAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">None</p>
              ) : (
                <div className="space-y-1.5">
                  {assetAccounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate flex-1">{a.name}</p>
                      <p className="text-xs font-medium tabular-nums text-emerald-500 shrink-0">
                        {formatUSD(parseFloat(a.balance))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liabilities column */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Liabilities
              </p>
              {liabilityAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">None</p>
              ) : (
                <div className="space-y-1.5">
                  {liabilityAccounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate flex-1">{a.name}</p>
                      <p className="text-xs font-medium tabular-nums text-rose-500 shrink-0">
                        {formatUSD(Math.abs(parseFloat(a.balance)))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
