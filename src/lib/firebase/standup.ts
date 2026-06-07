import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { StandupEntry } from '../types'

const COL = 'standups'

export async function getTodayStandups(date: string): Promise<StandupEntry[]> {
  const q = query(
    collection(db, COL),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StandupEntry))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0
      const bTime = b.createdAt?.toMillis?.() ?? 0
      return aTime - bTime
    })
}

export async function createStandup(
  data: Omit<StandupEntry, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getStandupHistory(
  limit_count: number = 30
): Promise<StandupEntry[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .slice(0, limit_count)
    .map(d => ({ id: d.id, ...d.data() } as StandupEntry))
}
