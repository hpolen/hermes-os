import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

// Simple shared secret auth — set CRON_SYNC_SECRET in env
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SYNC_SECRET
  if (!secret) return false
  const auth = req.headers.get('x-sync-secret')
  return auth === secret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { jobs: Record<string, unknown>[] }
    const { jobs } = body

    if (!Array.isArray(jobs)) {
      return NextResponse.json({ error: 'jobs must be an array' }, { status: 400 })
    }

    const db = getAdminDb()
    const batch = db.batch()

    for (const job of jobs) {
      const id = job.id as string
      if (!id) continue
      const ref = db.collection('cron_jobs').doc(id)
      batch.set(ref, {
        ...job,
        syncedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    await batch.commit()
    return NextResponse.json({ success: true, synced: jobs.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Returns pending actions for the local bridge to execute
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const snap = await db.collection('cron_actions')
      .where('status', '==', 'pending')
      .limit(20)
      .get()

    // Sort by createdAt client-side to avoid composite index requirement
    const actions = snap.docs
      .map(d => ({ docId: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTs = (a as Record<string, {_seconds?: number}>).createdAt?._seconds ?? 0
        const bTs = (b as Record<string, {_seconds?: number}>).createdAt?._seconds ?? 0
        return aTs - bTs
      })
    return NextResponse.json({ actions })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Mark action as done or failed
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { docId: string; status: 'done' | 'failed'; error?: string }
    const { docId, status, error: errMsg } = body

    const db = getAdminDb()
    await db.collection('cron_actions').doc(docId).update({
      status,
      executedAt: FieldValue.serverTimestamp(),
      ...(errMsg ? { error: errMsg } : {}),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
