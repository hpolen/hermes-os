import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'

export interface Recommendation {
  id: string
  text: string
  type: 'action' | 'review' | 'focus' | 'risk'
  projectId?: string
  createdAt: Timestamp
  dismissed: boolean
}

export async function getActiveRecommendations(): Promise<Recommendation[]> {
  const q = query(
    collection(db, 'recommendations'),
    where('dismissed', '==', false),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation))
}

export async function dismissRecommendation(id: string): Promise<void> {
  await updateDoc(doc(db, 'recommendations', id), { dismissed: true })
}

export async function createRecommendation(
  data: Omit<Recommendation, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'recommendations'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}
