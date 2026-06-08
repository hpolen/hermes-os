/**
 * financeSync.ts
 * Firestore finance data layer — typed reads for the Finance tab UI.
 * Data is written here by the Hermes cron sync job via the admin SDK.
 * Client-side reads use the public Firebase SDK.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceAccount {
  id: string
  name: string
  org_name: string
  currency: string
  balance: string
  available_balance: string
  balance_date: string
  type: string | null
  is_manual: boolean
  is_liability: boolean
  is_hidden: boolean
  syncedAt: Timestamp
}

export interface FinanceTransaction {
  id: string
  account_id: string
  posted: string
  transacted_at: string
  amount: string
  description: string
  payee: string | null
  memo: string | null
  category: string
  category_color: string | null
  syncedAt: Timestamp
}

export interface FinanceSpendingCategory {
  category: string
  total: string
  color: string | null
  syncedAt: Timestamp
}

export interface FinanceSyncMeta {
  lastSyncAt: string
  ageHours: number
  syncInProgress: boolean
  accountsCount: number
  transactionsCount: number
  updatedAt: Timestamp
}

// ─── Collection names ─────────────────────────────────────────────────────────

const ACCOUNTS_COL = 'finance_accounts'
const TRANSACTIONS_COL = 'finance_transactions'
const SPENDING_COL = 'finance_spending'
const META_DOC = 'finance_meta'
const META_COL = 'finance_config'

// ─── Client-side reads ────────────────────────────────────────────────────────

export async function getFinanceAccounts(): Promise<FinanceAccount[]> {
  const q = query(collection(db, ACCOUNTS_COL), where('is_hidden', '==', false))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as FinanceAccount))
}

export async function getFinanceTransactions(opts?: {
  accountId?: string
  category?: string
  limitN?: number
}): Promise<FinanceTransaction[]> {
  const constraints: QueryConstraint[] = []
  if (opts?.accountId && opts.accountId !== 'all') {
    constraints.push(where('account_id', '==', opts.accountId))
  }
  if (opts?.category && opts.category !== 'all') {
    constraints.push(where('category', '==', opts.category))
  }
  constraints.push(orderBy('posted', 'desc'))
  constraints.push(limit(opts?.limitN ?? 500))

  const q = query(collection(db, TRANSACTIONS_COL), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as FinanceTransaction))
}

export async function getFinanceSpending(): Promise<FinanceSpendingCategory[]> {
  const q = query(collection(db, SPENDING_COL), orderBy('total', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data() } as FinanceSpendingCategory))
}

export async function getFinanceMeta(): Promise<FinanceSyncMeta | null> {
  const ref = doc(db, META_COL, META_DOC)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as FinanceSyncMeta
}
