import {
  collection, doc, getDocs, setDoc, addDoc,
  updateDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp, deleteDoc,
} from 'firebase/firestore'
import { db } from './config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CronJobDoc {
  id: string           // hermes job id
  name: string
  schedule: string
  status: 'active' | 'paused'
  lastRun: string | null
  lastStatus: string | null
  nextRun: string | null
  deliver: string | null
  syncedAt: Timestamp
}

export type CronActionType = 'pause' | 'resume'
export type CronActionStatus = 'pending' | 'done' | 'failed'

export interface CronActionDoc {
  id: string           // Firestore doc id
  jobId: string        // hermes job id
  action: CronActionType
  status: CronActionStatus
  createdAt: Timestamp
  executedAt?: Timestamp
  error?: string
}

// ─── Client-side reads (used by the UI) ──────────────────────────────────────

const JOBS_COL = 'cron_jobs'
const ACTIONS_COL = 'cron_actions'

export async function getCronJobs(): Promise<CronJobDoc[]> {
  const q = query(collection(db, JOBS_COL), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as CronJobDoc))
}

export async function enqueueCronAction(
  jobId: string,
  action: CronActionType
): Promise<string> {
  const ref = await addDoc(collection(db, ACTIONS_COL), {
    jobId,
    action,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return ref.id
}
