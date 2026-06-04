import {
  collection, addDoc, getDocs, query,
  orderBy, where, limit, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './config'

export type MonitoringEventType = 'agent_run' | 'system_health' | 'standup' | 'alert'
export type MonitoringEventStatus = 'ok' | 'warning' | 'error'

export interface MonitoringEvent {
  id: string
  type: MonitoringEventType
  source: string
  status: MonitoringEventStatus
  message: string
  metadata: Record<string, unknown>
  timestamp: Timestamp
}

const COL = 'monitoring_events'

// Client-side functions (used in browser components)
export async function logMonitoringEvent(
  type: MonitoringEventType,
  source: string,
  status: MonitoringEventStatus,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    type, source, status, message, metadata,
    timestamp: serverTimestamp()
  })
  return ref.id
}

export async function getRecentEvents(limitCount = 50): Promise<MonitoringEvent[]> {
  const q = query(collection(db, COL), orderBy('timestamp', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonitoringEvent))
}

export async function getEventsByType(
  type: MonitoringEventType,
  limitCount = 20
): Promise<MonitoringEvent[]> {
  const q = query(
    collection(db, COL),
    where('type', '==', type),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonitoringEvent))
}

export async function getEventsByStatus(
  status: MonitoringEventStatus,
  limitCount = 20
): Promise<MonitoringEvent[]> {
  const q = query(
    collection(db, COL),
    where('status', '==', status),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonitoringEvent))
}
