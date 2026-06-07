import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

interface RecommendationPayload {
  type: 'action' | 'review' | 'focus' | 'risk'
  text: string
  projectId?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const recommendations: RecommendationPayload[] = Array.isArray(body) ? body : [body]
    const db = getAdminDb()
    const col = db.collection('recommendations')

    const ids = await Promise.all(
      recommendations.map(async (rec) => {
        const payload: Record<string, unknown> = {
          type: rec.type,
          text: rec.text,
          dismissed: false,
          createdAt: FieldValue.serverTimestamp(),
        }
        if (rec.projectId !== undefined) {
          payload.projectId = rec.projectId
        }
        const ref = await col.add(payload)
        return ref.id
      })
    )

    return NextResponse.json({ success: true, count: ids.length, ids })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
