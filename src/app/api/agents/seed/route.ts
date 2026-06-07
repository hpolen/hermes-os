import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { SEED_AGENTS } from '@/lib/data/seed-agents'

export async function POST() {
  try {
    const db = getAdminDb()
    const col = db.collection('agents')

    // Check if already seeded
    const existing = await col.limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ message: 'Agents already seeded', skipped: true })
    }

    const batch = db.batch()
    for (const agent of SEED_AGENTS) {
      const ref = col.doc()
      batch.set(ref, {
        ...agent,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()

    return NextResponse.json({ success: true, count: SEED_AGENTS.length })
  } catch (error) {
    console.error('Seed agents error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
