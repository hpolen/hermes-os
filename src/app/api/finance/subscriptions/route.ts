import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export interface Subscription {
  payee: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'annual'
  last_charged: string
  next_expected: string
  occurrences: number
  category: string
  total_annual: number
}

interface RawTransaction {
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

function normalizePayeeKey(payee: string): string {
  // Lowercase, strip numbers 4+ digits, trim whitespace
  return payee
    .toLowerCase()
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db
      .collection('finance_transactions')
      .orderBy('posted', 'desc')
      .limit(1000)
      .get()

    const txns = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RawTransaction[]

    // Filter to expenses only
    const expenses = txns.filter(t => parseFloat(t.amount) < 0)

    // Group by normalized payee key
    const groups = new Map<string, RawTransaction[]>()
    for (const txn of expenses) {
      const rawPayee = txn.payee || txn.description
      const key = normalizePayeeKey(rawPayee)
      if (!key) continue
      const existing = groups.get(key)
      if (existing) {
        existing.push(txn)
      } else {
        groups.set(key, [txn])
      }
    }

    const subscriptions: Subscription[] = []

    for (const [, group] of groups) {
      if (group.length < 2) continue

      // Sort by date ascending
      const sorted = [...group].sort((a, b) => {
        return new Date(a.posted).getTime() - new Date(b.posted).getTime()
      })

      // Compute intervals in days between consecutive transactions
      const intervals: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]!.posted).getTime()
        const curr = new Date(sorted[i]!.posted).getTime()
        const days = (curr - prev) / (1000 * 60 * 60 * 24)
        intervals.push(days)
      }

      if (intervals.length === 0) continue

      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length

      // Detect frequency
      let frequency: 'monthly' | 'weekly' | 'annual' | null = null
      if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly'
      else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly'
      else if (avgInterval >= 340 && avgInterval <= 390) frequency = 'annual'

      if (!frequency) continue

      // Check amount consistency: all amounts within 15% of average
      const amounts = sorted.map(t => Math.abs(parseFloat(t.amount)))
      const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length
      const threshold = avgAmount * 0.15
      const consistent = amounts.every(a => Math.abs(a - avgAmount) <= threshold)

      if (!consistent) continue

      // Build subscription entry
      const lastTxn = sorted[sorted.length - 1]!
      const lastDate = lastTxn.posted.split('T')[0] ?? lastTxn.posted

      const intervalDays =
        frequency === 'monthly' ? 30 :
        frequency === 'weekly' ? 7 :
        365

      const nextExpected = addDays(lastDate, intervalDays)

      const totalAnnual =
        frequency === 'monthly' ? avgAmount * 12 :
        frequency === 'weekly' ? avgAmount * 52 :
        avgAmount

      subscriptions.push({
        payee: lastTxn.payee || lastTxn.description,
        amount: parseFloat(avgAmount.toFixed(2)),
        frequency,
        last_charged: lastDate,
        next_expected: nextExpected,
        occurrences: sorted.length,
        category: lastTxn.category || 'Uncategorized',
        total_annual: parseFloat(totalAnnual.toFixed(2)),
      })
    }

    // Sort by total_annual descending
    subscriptions.sort((a, b) => b.total_annual - a.total_annual)

    return NextResponse.json(subscriptions)
  } catch (err) {
    console.error('[finance/subscriptions]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
