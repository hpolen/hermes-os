import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('cron_jobs').orderBy('name').get()

    if (snap.empty) {
      return NextResponse.json({
        jobs: [],
        notice: 'No cron jobs synced yet. The local sync bridge may not be running.',
      })
    }

    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
