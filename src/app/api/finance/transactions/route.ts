import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('account_id') ?? 'all'
    const category = searchParams.get('category') ?? 'all'
    const search = searchParams.get('search') ?? ''
    const limitN = parseInt(searchParams.get('limit') ?? '500', 10)

    const db = getAdminDb()
    let q = db.collection('finance_transactions').orderBy('posted', 'desc')

    if (accountId !== 'all') q = q.where('account_id', '==', accountId) as typeof q
    if (category !== 'all') q = q.where('category', '==', category) as typeof q

    q = q.limit(limitN) as typeof q

    const snap = await q.get()
    let txns = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Client-side search filter (Firestore doesn't support full-text)
    if (search) {
      const lower = search.toLowerCase()
      txns = txns.filter((t: Record<string, unknown>) => {
        const desc = (t.description as string ?? '').toLowerCase()
        const payee = (t.payee as string ?? '').toLowerCase()
        return desc.includes(lower) || payee.includes(lower)
      })
    }

    return NextResponse.json(txns)
  } catch (err) {
    console.error('[finance/transactions]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
