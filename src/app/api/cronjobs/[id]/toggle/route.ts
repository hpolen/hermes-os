import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as { action: 'pause' | 'resume' }
    const { action } = body

    if (action !== 'pause' && action !== 'resume') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "pause" or "resume".' },
        { status: 400 }
      )
    }

    const db = getAdminDb()

    // Enqueue the action — local sync bridge will pick this up
    await db.collection('cron_actions').add({
      jobId: id,
      action,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    })

    // Optimistically update the job status in Firestore
    const newStatus = action === 'pause' ? 'paused' : 'active'
    await db.collection('cron_jobs').doc(id).update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true, action, jobId: id })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
