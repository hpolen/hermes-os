import { NextResponse } from 'next/server'
import { createRecommendation } from '@/lib/firebase/recommendations'

interface RecommendationPayload {
  type: 'action' | 'review' | 'focus' | 'risk'
  text: string
  projectId?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const recommendations: RecommendationPayload[] = Array.isArray(body) ? body : [body]

    const ids = await Promise.all(
      recommendations.map(rec =>
        createRecommendation({
          type: rec.type,
          text: rec.text,
          projectId: rec.projectId,
          dismissed: false,
        })
      )
    )

    return NextResponse.json({ success: true, count: ids.length, ids })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
