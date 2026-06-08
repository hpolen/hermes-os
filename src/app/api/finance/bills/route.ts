import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

// ─── Known Bills Database ─────────────────────────────────────────────────────

interface BillMeta {
  displayName: string
  category: string
  icon: string
  billType: string
}

const KNOWN_BILLS: Record<string, BillMeta> = {
  // Auto Loans
  'honda financial':    { displayName: 'Honda Financial',     category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'toyota financial':   { displayName: 'Toyota Financial',    category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'ford motor credit':  { displayName: 'Ford Motor Credit',   category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'gm financial':       { displayName: 'GM Financial',         category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'ally financial':     { displayName: 'Ally Auto',            category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'capital one auto':   { displayName: 'Capital One Auto',     category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'chase auto':         { displayName: 'Chase Auto',           category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'carmax auto':        { displayName: 'CarMax Auto Finance',  category: 'Auto',           icon: '🚗', billType: 'Loan' },
  'usaa auto':          { displayName: 'USAA Auto',            category: 'Auto',           icon: '🚗', billType: 'Loan' },

  // Student Loans
  'department of education': { displayName: 'Student Loan (Dept. of Ed.)', category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'dept of education':       { displayName: 'Student Loan (Dept. of Ed.)', category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'dept education':          { displayName: 'Student Loan (Dept. of Ed.)', category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'navient':                 { displayName: 'Navient Student Loan',         category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'sallie mae':              { displayName: 'Sallie Mae',                   category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'mohela':                  { displayName: 'MOHELA Student Loan',          category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'fedloan':                 { displayName: 'FedLoan Servicing',            category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'great lakes':             { displayName: 'Great Lakes Loan',             category: 'Student Loan', icon: '🎓', billType: 'Loan' },
  'aidvantage':              { displayName: 'Aidvantage',                   category: 'Student Loan', icon: '🎓', billType: 'Loan' },

  // Mortgage / Rent
  'mortgage':          { displayName: 'Mortgage Payment',          category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'quicken loans':     { displayName: 'Rocket Mortgage',           category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'rocket mortgage':   { displayName: 'Rocket Mortgage',           category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'pennymac':          { displayName: 'PennyMac Mortgage',         category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'loancare':          { displayName: 'LoanCare Mortgage',         category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'mr cooper':         { displayName: 'Mr. Cooper Mortgage',       category: 'Housing', icon: '🏠', billType: 'Mortgage' },
  'rent':              { displayName: 'Rent',                       category: 'Housing', icon: '🏠', billType: 'Rent' },
  'py at your serv':   { displayName: 'Rent/Mortgage Payment',     category: 'Housing', icon: '🏠', billType: 'Rent' },

  // Utilities
  'duke energy':       { displayName: 'Duke Energy',               category: 'Utilities',       icon: '⚡', billType: 'Utility' },
  'aep':               { displayName: 'AEP Electric',              category: 'Utilities',       icon: '⚡', billType: 'Utility' },
  'duke':              { displayName: 'Duke Energy',               category: 'Utilities',       icon: '⚡', billType: 'Utility' },
  'columbia gas':      { displayName: 'Columbia Gas',              category: 'Utilities',       icon: '🔥', billType: 'Utility' },
  'atmos energy':      { displayName: 'Atmos Energy',              category: 'Utilities',       icon: '🔥', billType: 'Utility' },
  'vectren':           { displayName: 'Vectren / CenterPoint',     category: 'Utilities',       icon: '🔥', billType: 'Utility' },
  'centerpoint':       { displayName: 'CenterPoint Energy',        category: 'Utilities',       icon: '🔥', billType: 'Utility' },
  'american electric': { displayName: 'AEP Electric',              category: 'Utilities',       icon: '⚡', billType: 'Utility' },
  'water':             { displayName: 'Water Bill',                category: 'Utilities',       icon: '💧', billType: 'Utility' },
  'sewer':             { displayName: 'Sewer Bill',                category: 'Utilities',       icon: '💧', billType: 'Utility' },
  'trash':             { displayName: 'Trash Service',             category: 'Utilities',       icon: '🗑️', billType: 'Utility' },
  'rumpke':            { displayName: 'Rumpke Waste',              category: 'Utilities',       icon: '🗑️', billType: 'Utility' },

  // Internet / Phone
  'spectrum':          { displayName: 'Spectrum',                  category: 'Internet/Phone',  icon: '📡', billType: 'Utility' },
  'xfinity':           { displayName: 'Xfinity / Comcast',        category: 'Internet/Phone',  icon: '📡', billType: 'Utility' },
  'comcast':           { displayName: 'Xfinity / Comcast',        category: 'Internet/Phone',  icon: '📡', billType: 'Utility' },
  'at&t':              { displayName: 'AT&T',                      category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'att':               { displayName: 'AT&T',                      category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'verizon':           { displayName: 'Verizon',                   category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  't-mobile':          { displayName: 'T-Mobile',                  category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'tmobile':           { displayName: 'T-Mobile',                  category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'cox':               { displayName: 'Cox Communications',        category: 'Internet/Phone',  icon: '📡', billType: 'Utility' },
  'windstream':        { displayName: 'Windstream',                category: 'Internet/Phone',  icon: '📡', billType: 'Utility' },
  'google fi':         { displayName: 'Google Fi',                 category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'boost mobile':      { displayName: 'Boost Mobile',             category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },
  'mint mobile':       { displayName: 'Mint Mobile',              category: 'Internet/Phone',  icon: '📱', billType: 'Utility' },

  // Insurance
  'geico':             { displayName: 'GEICO',                     category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'progressive':       { displayName: 'Progressive',              category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'state farm':        { displayName: 'State Farm',               category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'allstate':          { displayName: 'Allstate',                 category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'nationwide':        { displayName: 'Nationwide Insurance',     category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'liberty mutual':    { displayName: 'Liberty Mutual',           category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'usaa':              { displayName: 'USAA Insurance',           category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'farmers':           { displayName: 'Farmers Insurance',        category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'anthem':            { displayName: 'Anthem Health',            category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'cigna':             { displayName: 'Cigna',                    category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'aetna':             { displayName: 'Aetna',                    category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'humana':            { displayName: 'Humana',                   category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'oscar health':      { displayName: 'Oscar Health',             category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },
  'unitedhealth':      { displayName: 'UnitedHealth',             category: 'Insurance',       icon: '🛡️', billType: 'Insurance' },

  // Credit Card Payments
  'discover':              { displayName: 'Discover Card Payment', category: 'Credit Card', icon: '💳', billType: 'Credit Card' },
  'apple credit card':     { displayName: 'Apple Card Payment',    category: 'Credit Card', icon: '💳', billType: 'Credit Card' },
  'credit card payment':   { displayName: 'Credit Card Payment',   category: 'Credit Card', icon: '💳', billType: 'Credit Card' },
  'interest charge':       { displayName: 'Credit Card Interest',  category: 'Credit Card', icon: '💳', billType: 'Fee' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bill {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePayee(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\*[\w\d]+/g, '')                          // strip *XXXX
    .replace(/\.com|\.net|\.org|\.io|\.app/g, '')       // strip TLDs
    .replace(/\b(inc|llc|corp|ltd|co|usa|us|ca)\b/gi, '') // strip legal/geo suffixes
    .replace(/\d{4,}/g, '')                              // strip 4+ digit numbers
    .replace(/[^a-z0-9\s&]/g, ' ')                      // replace special chars (keep &)
    .replace(/\s+/g, ' ')
    .trim()
}

function matchKnownBill(normalizedPayee: string): [string, BillMeta] | null {
  // Sort keys by length descending so longer/more-specific keys match first
  const keys = Object.keys(KNOWN_BILLS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (normalizedPayee.includes(key)) {
      return [key, KNOWN_BILLS[key]!]
    }
  }
  return null
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

function detectFrequency(intervals: number[]): 'monthly' | 'annual' | 'variable' {
  if (intervals.length === 0) return 'monthly'
  const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length
  if (avg >= 20 && avg <= 40)   return 'monthly'
  if (avg >= 340 && avg <= 400) return 'annual'
  return 'variable'
}

function billStatus(nextDue: string): Bill['status'] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDue)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0)  return 'overdue'
  if (diffDays <= 3) return 'due_soon'
  if (diffDays <= 7) return 'upcoming'
  return 'active'
}

// ─── Route Handler ────────────────────────────────────────────────────────────

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

    // Match each expense against KNOWN_BILLS and group by bill key
    const groups = new Map<string, { meta: BillMeta; txns: RawTransaction[] }>()

    for (const txn of expenses) {
      const rawPayee = txn.payee || txn.description
      if (!rawPayee) continue
      const normalized = normalizePayee(rawPayee)
      const match = matchKnownBill(normalized)
      if (!match) continue

      const [billKey, meta] = match
      const existing = groups.get(billKey)
      if (existing) {
        existing.txns.push(txn)
      } else {
        groups.set(billKey, { meta, txns: [txn] })
      }
    }

    const bills: Bill[] = []

    for (const [billKey, { meta, txns: group }] of groups.entries()) {
      // Sort ascending by posted date
      const sorted = [...group].sort(
        (a, b) => new Date(a.posted).getTime() - new Date(b.posted).getTime()
      )

      // Compute intervals between consecutive charges
      const intervals: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]!.posted).getTime()
        const curr = new Date(sorted[i]!.posted).getTime()
        intervals.push((curr - prev) / 86_400_000)
      }

      const frequency = detectFrequency(intervals)

      // Average amount (abs value)
      const amounts = sorted.map(t => Math.abs(parseFloat(t.amount)))
      const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length

      // Last charge date
      const lastTxn = sorted[sorted.length - 1]!
      const lastCharged = lastTxn.posted.split('T')[0] ?? lastTxn.posted

      // Project next due date
      const intervalDays = frequency === 'annual' ? 365 : 30
      const nextDue = addDays(lastCharged, intervalDays)

      // Monthly amount (normalized)
      const monthlyAmount =
        frequency === 'annual'   ? avgAmount / 12 :
        frequency === 'variable' ? avgAmount       :
        avgAmount

      const status = billStatus(nextDue)

      bills.push({
        id: slugify(billKey),
        payee: meta.displayName,
        icon: meta.icon,
        category: meta.category,
        billType: meta.billType,
        amount: parseFloat(avgAmount.toFixed(2)),
        frequency,
        last_charged: lastCharged,
        next_due: nextDue,
        occurrences: sorted.length,
        status,
        monthly_amount: parseFloat(monthlyAmount.toFixed(2)),
      })
    }

    // Sort by next_due ascending (most urgent first)
    bills.sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())

    return NextResponse.json(bills)
  } catch (err) {
    console.error('[finance/bills]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
