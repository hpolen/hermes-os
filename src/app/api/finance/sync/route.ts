import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { mcpCall } from '@/lib/finance/mcpClient'

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('finance_config').doc('finance_meta').get()
    if (!snap.exists) {
      return NextResponse.json({ synced: false, lastSyncAt: null })
    }
    return NextResponse.json({ synced: true, ...snap.data() })
  } catch (err) {
    console.error('[finance/sync GET]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Trigger goetta-finance sync (local daemon only — no-op in prod)
    let syncResult: unknown = null
    try {
      syncResult = await mcpCall('sync_now', {})
    } catch {
      // Daemon not available in prod — that's fine, sync happens via cron
      syncResult = { message: 'Daemon not available — sync runs via scheduled cron job' }
    }
    return NextResponse.json({ ok: true, result: syncResult })
  } catch (err) {
    console.error('[finance/sync POST]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
