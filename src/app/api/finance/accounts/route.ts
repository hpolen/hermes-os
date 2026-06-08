import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db
      .collection('finance_accounts')
      .where('is_hidden', '==', false)
      .get()

    if (snap.empty) {
      // Check if we've ever synced
      const meta = await db.collection('finance_config').doc('finance_meta').get()
      if (!meta.exists) {
        return NextResponse.json({ error: 'not_synced' }, { status: 503 })
      }
    }

    const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json(accounts)
  } catch (err) {
    console.error('[finance/accounts]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
