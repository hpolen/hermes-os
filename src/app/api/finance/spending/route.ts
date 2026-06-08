import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db
      .collection('finance_spending')
      .orderBy('total', 'desc')
      .get()

    const spending = snap.docs.map(d => ({ ...d.data() }))
    return NextResponse.json(spending)
  } catch (err) {
    console.error('[finance/spending]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
