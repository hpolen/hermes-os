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
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { Task } from '../types'

const COL = 'tasks'

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const q = query(collection(db, COL), where('projectId', '==', projectId), orderBy('createdAt'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task))
}

export async function getTask(id: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null
}

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
