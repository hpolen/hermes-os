import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export type MonitoringEventType = 'agent_run' | 'system_health' | 'standup' | 'alert'
export type MonitoringEventStatus = 'ok' | 'warning' | 'error'

const COL = 'monitoring_events'
const VALID_TYPES: MonitoringEventType[] = ['agent_run', 'system_health', 'standup', 'alert']
const VALID_STATUSES: MonitoringEventStatus[] = ['ok', 'warning', 'error']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, source, status, message, metadata } = body

    if (!type || !source || !status || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, source, status, message' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const ref = await db.collection(COL).add({
      type,
      source,
      status,
      message,
      metadata: metadata ?? {},
      timestamp: FieldValue.serverTimestamp()
    })

    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('Monitoring log error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitCount = parseInt(searchParams.get('limit') ?? '50')
    const typeFilter = searchParams.get('type') as MonitoringEventType | null
    const statusFilter = searchParams.get('status') as MonitoringEventStatus | null

    const db = getAdminDb()
    let query = db.collection(COL).orderBy('timestamp', 'desc').limit(limitCount)

    if (typeFilter && VALID_TYPES.includes(typeFilter)) {
      query = db.collection(COL)
        .where('type', '==', typeFilter)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
    }

    if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
      query = db.collection(COL)
        .where('status', '==', statusFilter)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
    }

    const snap = await query.get()
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
