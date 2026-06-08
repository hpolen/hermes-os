import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { DailyTask } from '../types'

const COL = 'daily_tasks'

export async function getDailyTasks(date: string): Promise<DailyTask[]> {
  // No orderBy in query — Firestore would require a composite index for
  // where('date') + orderBy('order'). Sort client-side instead.
  const q = query(collection(db, COL), where('date', '==', date))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as DailyTask))
    .sort((a, b) => a.order - b.order)
}

export async function createDailyTask(
  data: Omit<DailyTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateDailyTask(
  id: string,
  data: Partial<DailyTask>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDailyTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

/**
 * Roll a task to the next day.
 * Creates a copy on toDate (status='todo', rollCount incremented, order=999)
 * then marks the original task as 'rolled'.
 * Returns the new task's id.
 */
export async function rollTask(
  task: DailyTask,
  toDate: string
): Promise<string> {
  const newTaskRef = await addDoc(collection(db, COL), {
    userId: task.userId,
    date: toDate,
    text: task.text,
    status: 'todo',
    order: 999,
    pillarId: task.pillarId ?? null,
    initiativeId: task.initiativeId ?? null,
    rollCount: task.rollCount + 1,
    rolledFromDate: task.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, COL, task.id), {
    status: 'rolled',
    updatedAt: serverTimestamp(),
  })

  return newTaskRef.id
}

/**
 * Fetch tasks for a user across the last N days (default 7).
 * Uses only where('userId') to avoid composite index requirements,
 * then filters by date client-side.
 */
export async function getTaskHistory(
  userId: string,
  days: number = 7
): Promise<DailyTask[]> {
  const q = query(collection(db, COL), where('userId', '==', userId))
  const snap = await getDocs(q)
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTask))

  // Build the earliest date boundary (inclusive) as a YYYY-MM-DD string
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return all
    .filter(t => t.date >= cutoffStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.order - b.order
    })
}
