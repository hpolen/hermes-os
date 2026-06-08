import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { Initiative } from '../types'

const COL = 'initiatives'

export async function getInitiatives(pillarId?: string): Promise<Initiative[]> {
  // Do NOT combine where + orderBy — Firestore requires a composite index for that.
  // When filtering by pillarId, use where only and sort client-side.
  // When fetching all, use orderBy only.
  const q = pillarId
    ? query(collection(db, COL), where('pillarId', '==', pillarId))
    : query(collection(db, COL), orderBy('order', 'asc'))

  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Initiative))

  if (pillarId) {
    return docs.sort((a, b) => a.order - b.order)
  }
  return docs
}

export async function createInitiative(
  data: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateInitiative(
  id: string,
  data: Partial<Initiative>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteInitiative(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
