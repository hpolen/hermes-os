import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { Initiative } from '@/lib/types'
import { getAdminDb } from '@/lib/firebase/admin'
import { SEED_PILLARS, SEED_INITIATIVES } from '@/lib/data/seed-focus'

export async function POST() {
  try {
    const db = getAdminDb()

    // 1. Check if pillars collection already has docs — skip if so
    const existingSnapshot = await db.collection('pillars').limit(1).get()
    if (!existingSnapshot.empty) {
      return NextResponse.json({ skipped: true })
    }

    // 2. Create all 6 pillars and capture their real Firestore IDs in order
    const pillarIds: string[] = []

    for (const pillar of SEED_PILLARS) {
      const ref = await db.collection('pillars').add({
        ...pillar,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      pillarIds.push(ref.id)
    }

    // 3. Create all initiatives with real pillarIds substituted
    const initiativeWrites = SEED_INITIATIVES.map((initiative: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Replace placeholder with the real Firestore pillar ID
      const match = initiative.pillarId.match(/^PLACEHOLDER_pillarIndex_(\d+)$/)
      const resolvedPillarId = match ? (pillarIds[parseInt(match[1])] ?? initiative.pillarId) : initiative.pillarId

      return db.collection('initiatives').add({
        ...initiative,
        pillarId: resolvedPillarId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    await Promise.all(initiativeWrites)

    // 4. Return summary
    return NextResponse.json({
      success: true,
      pillars: pillarIds.length,
      initiatives: SEED_INITIATIVES.length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
