import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

interface BudgetDoc {
  category: string
  monthly_limit: number
  created_at: string
  updated_at: string
}

function categoryToId(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('finance_budgets').get()
    const budgets = snap.docs.map(d => ({ id: d.id, ...(d.data() as BudgetDoc) }))
    return NextResponse.json(budgets)
  } catch (err) {
    console.error('[finance/budgets GET]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { category: string; monthly_limit: number }
    const { category, monthly_limit } = body

    if (!category || typeof monthly_limit !== 'number') {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }

    const db = getAdminDb()
    const docId = categoryToId(category)
    const ref = db.collection('finance_budgets').doc(docId)
    const existing = await ref.get()

    const now = new Date().toISOString()

    const data: BudgetDoc = {
      category,
      monthly_limit,
      created_at: existing.exists ? (existing.data() as BudgetDoc).created_at : now,
      updated_at: now,
    }

    await ref.set(data)
    return NextResponse.json({ id: docId, ...data })
  } catch (err) {
    console.error('[finance/budgets POST]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'missing_category' }, { status: 400 })
    }

    const db = getAdminDb()
    const docId = categoryToId(category)
    await db.collection('finance_budgets').doc(docId).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[finance/budgets DELETE]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
