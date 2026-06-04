import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { TimelineEvent, TimelineEventType } from '../types'

const COL = 'timeline'

export async function getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent))
}

export async function logTimelineEvent(
  projectId: string,
  eventType: TimelineEventType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await addDoc(collection(db, COL), {
    projectId,
    type: eventType,
    description,
    metadata: metadata ?? {},
    createdAt: serverTimestamp(),
  })
}
