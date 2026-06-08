import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillDoc {
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
}

interface BillWithId extends BillDoc {
  id: string
  next_due: string
  status: 'overdue' | 'due_soon' | 'upcoming' | 'active'
}

// ─── Hardcoded Suggestions (from transaction auto-detection) ──────────────────

const SUGGESTIONS = [
  {
    name: 'Rent/Mortgage Payment',
    amount: 1295.00,
    due_day: 5,
    category: 'Housing',
    bill_type: 'Rent',
    frequency: 'monthly',
    icon: '🏠',
    account: 'U.S. Bank Checking',
    notes: 'Detected from Py at Your Serv transactions',
    alert_days_before: 3,
  },
  {
    name: 'Honda Financial',
    amount: 535.00,
    due_day: 5,
    category: 'Auto',
    bill_type: 'Loan',
    frequency: 'monthly',
    icon: '🚗',
    account: 'U.S. Bank Checking',
    notes: 'Auto loan payment',
    alert_days_before: 3,
  },
  {
    name: 'Student Loan',
    amount: 127.67,
    due_day: 5,
    category: 'Student Loan',
    bill_type: 'Loan',
    frequency: 'monthly',
    icon: '🎓',
    account: 'U.S. Bank Checking',
    notes: 'Dept. of Education',
    alert_days_before: 3,
  },
  {
    name: 'Discover Card Payment',
    amount: 247.00,
    due_day: 3,
    category: 'Credit Card',
    bill_type: 'Credit Card',
    frequency: 'monthly',
    icon: '💳',
    account: 'U.S. Bank Checking',
    notes: '',
    alert_days_before: 5,
  },
  {
    name: 'Apple Card Payment',
    amount: 22.50,
    due_day: 5,
    category: 'Credit Card',
    bill_type: 'Credit Card',
    frequency: 'monthly',
    icon: '💳',
    account: 'U.S. Bank Checking',
    notes: '',
    alert_days_before: 3,
  },
  {
    name: 'Credit Card Interest',
    amount: 70.79,
    due_day: 6,
    category: 'Credit Card',
    bill_type: 'Fee',
    frequency: 'monthly',
    icon: '💳',
    account: 'Citi Simplicity',
    notes: 'Interest charges',
    alert_days_before: 1,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function computeNextDue(dueDay: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // Try current month first
  let candidate = new Date(year, month, dueDay)
  if (candidate < today) {
    // Move to next month
    candidate = new Date(year, month + 1, dueDay)
  }
  return candidate.toISOString().split('T')[0]!
}

function computeStatus(nextDue: string): BillWithId['status'] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDue)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'due_soon'
  if (diffDays <= 7) return 'upcoming'
  return 'active'
}

function enrichBill(id: string, doc: BillDoc): BillWithId {
  const next_due = computeNextDue(doc.due_day)
  const status = computeStatus(next_due)
  return { id, ...doc, next_due, status }
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isSuggestions = searchParams.get('suggestions') === 'true'

    const db = getAdminDb()

    if (isSuggestions) {
      // Return suggestions that haven't been added yet (check by name, case-insensitive)
      const snap = await db.collection('finance_bills').get()
      const existingNames = new Set(
        snap.docs.map(d => (d.data() as BillDoc).name?.toLowerCase().trim())
      )
      const filtered = SUGGESTIONS.filter(
        s => !existingNames.has(s.name.toLowerCase().trim())
      )
      return NextResponse.json(filtered)
    }

    // Normal GET: fetch all bills
    const snap = await db.collection('finance_bills').get()
    const bills: BillWithId[] = snap.docs
      .map(d => enrichBill(d.id, d.data() as BillDoc))
      .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())

    return NextResponse.json(bills)
  } catch (err) {
    console.error('[finance/bills GET]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<BillDoc, 'created_at' | 'updated_at'>

    if (!body.name || typeof body.amount !== 'number') {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const docId = `${slugify(body.name)}_${Date.now()}`

    const doc: BillDoc = {
      name: body.name,
      amount: body.amount,
      due_day: body.due_day ?? 1,
      category: body.category ?? 'Other',
      bill_type: body.bill_type ?? 'Other',
      frequency: body.frequency ?? 'monthly',
      icon: body.icon ?? '🧾',
      account: body.account ?? '',
      notes: body.notes ?? '',
      is_active: body.is_active ?? true,
      alert_days_before: body.alert_days_before ?? 3,
      source: body.source ?? 'manual',
      created_at: now,
      updated_at: now,
    }

    const db = getAdminDb()
    await db.collection('finance_bills').doc(docId).set(doc)

    return NextResponse.json(enrichBill(docId, doc), { status: 201 })
  } catch (err) {
    console.error('[finance/bills POST]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { id: string } & Partial<BillDoc>
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('finance_bills').doc(id)
    const existing = await ref.get()

    if (!existing.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    await ref.update({ ...updates, updated_at: now })

    const updated = { ...(existing.data() as BillDoc), ...updates, updated_at: now }
    return NextResponse.json(enrichBill(id, updated))
  } catch (err) {
    console.error('[finance/bills PUT]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('finance_bills').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[finance/bills DELETE]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
