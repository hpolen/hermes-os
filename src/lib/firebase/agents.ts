import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { Agent } from '../types'

const COL = 'agents'

export async function getAgents(): Promise<Agent[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Agent))
}

export async function getAgent(id: string): Promise<Agent | null> {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Agent) : null
}

export async function createAgent(
  data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteAgent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
