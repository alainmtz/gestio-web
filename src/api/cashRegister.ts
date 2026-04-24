import { supabase } from '@/lib/supabase'

// ─── Currency ─────────────────────────────────────────────────────────────────

export type CurrencyCode = 'CUP' | 'USD' | 'EUR' | 'MLC'

export type CurrencyAmounts = Partial<Record<CurrencyCode, number>>

// ─── Session ──────────────────────────────────────────────────────────────────

/** DB stores status in uppercase: OPEN, CLOSED, SUSPENDED */
export type SessionStatus = 'OPEN' | 'CLOSED' | 'SUSPENDED'

export interface CashSession {
  id: string
  organization_id: string
  store_id: string
  user_id: string
  /** Multi-currency opening amounts: { CUP: 1000, USD: 50 } */
  opening_amounts: CurrencyAmounts
  /** Multi-currency closing amounts */
  closing_amounts?: CurrencyAmounts | null
  /** Multi-currency expected amounts */
  expected_amounts?: CurrencyAmounts | null
  /** Multi-currency differences (closing - expected) */
  differences?: CurrencyAmounts | null
  status: SessionStatus
  opened_at: string
  closed_at?: string
  notes?: string
  store?: { name: string }
  user?: { full_name: string }
}

export interface OpenSessionInput {
  organization_id: string
  store_id: string
  user_id: string
  opening_amounts: CurrencyAmounts
}

export interface CloseSessionInput {
  session_id: string
  closing_amounts: CurrencyAmounts
  expected_amounts: CurrencyAmounts
  differences: CurrencyAmounts
  notes?: string
}

// ─── Movement ─────────────────────────────────────────────────────────────────

/** DB values are uppercase */
export type CashMovementType = 'INCOME' | 'EXPENSE' | 'WITHDRAWAL' | 'DEPOSIT'

export interface CashMovement {
  id: string
  register_id: string
  movement_type: CashMovementType
  /** ISO currency code stored directly on the row */
  currency: CurrencyCode
  amount: string
  category?: string
  reference?: string
  notes?: string
  created_at: string
}

export interface AddMovementInput {
  register_id: string
  movement_type: CashMovementType
  currency: CurrencyCode
  amount: number
  notes?: string
  reference?: string
  category?: string
  user_id: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a CurrencyAmounts object as a readable string */
export function formatCurrencyAmounts(amounts: CurrencyAmounts | null | undefined): string {
  if (!amounts) return '—'
  return Object.entries(amounts)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${v?.toFixed(2)} ${k}`)
    .join(' / ')
}

/** Returns active currencies (those with amount > 0) from an amounts map */
export function getActiveCurrencies(amounts: CurrencyAmounts | null | undefined): CurrencyCode[] {
  if (!amounts) return []
  return Object.entries(amounts)
    .filter(([, v]) => v !== undefined && v > 0)
    .map(([k]) => k as CurrencyCode)
}

/**
 * Calculates expected amounts per currency.
 * opening + INCOME/DEPOSIT - EXPENSE/WITHDRAWAL
 */
export function calcExpectedAmounts(
  openingAmounts: CurrencyAmounts,
  movements: CashMovement[],
): CurrencyAmounts {
  const result: CurrencyAmounts = { ...openingAmounts }

  for (const m of movements) {
    const currency = m.currency ?? 'CUP'
    const amount = parseFloat(m.amount) || 0
    const current = result[currency] ?? 0

    if (m.movement_type === 'INCOME' || m.movement_type === 'DEPOSIT') {
      result[currency] = current + amount
    } else if (m.movement_type === 'EXPENSE' || m.movement_type === 'WITHDRAWAL') {
      result[currency] = current - amount
    }
  }

  return result
}

/**
 * Calculates the difference between closing and expected amounts per currency.
 */
export function calcDifferences(
  closingAmounts: CurrencyAmounts,
  expectedAmounts: CurrencyAmounts,
): CurrencyAmounts {
  const currencies = new Set([
    ...Object.keys(closingAmounts),
    ...Object.keys(expectedAmounts),
  ]) as Set<CurrencyCode>

  const result: CurrencyAmounts = {}
  for (const c of currencies) {
    result[c] = (closingAmounts[c] ?? 0) - (expectedAmounts[c] ?? 0)
  }
  return result
}

// ─── API Functions ────────────────────────────────────────────────────────────

const SESSION_SELECT = '*, store:stores(name), user:profiles(full_name)'

export async function fetchSessions(organizationId: string): Promise<CashSession[]> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select(SESSION_SELECT)
    .eq('organization_id', organizationId)
    .order('opened_at', { ascending: false })
  if (error) throw error
  return (data as CashSession[]) || []
}

export async function fetchActiveSession(
  organizationId: string,
  userId: string,
): Promise<CashSession | null> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select(SESSION_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'OPEN')
    .maybeSingle()
  if (error) throw error
  return data as CashSession | null
}

export async function fetchSession(id: string): Promise<CashSession> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select(SESSION_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as CashSession
}

export async function openSession(input: OpenSessionInput): Promise<CashSession> {
  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      organization_id: input.organization_id,
      store_id: input.store_id,
      user_id: input.user_id,
      opening_amounts: input.opening_amounts,
      status: 'OPEN',
    })
    .select(SESSION_SELECT)
    .single()
  if (error) throw error
  return data as CashSession
}

export async function closeSession(input: CloseSessionInput): Promise<void> {
  const { error } = await supabase
    .from('cash_registers')
    .update({
      closing_amounts: input.closing_amounts,
      expected_amounts: input.expected_amounts,
      differences: input.differences,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      notes: input.notes || null,
    })
    .eq('id', input.session_id)
  if (error) throw error
}

export async function suspendSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('cash_registers')
    .update({ status: 'SUSPENDED' })
    .eq('id', sessionId)
  if (error) throw error
}

export async function resumeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('cash_registers')
    .update({ status: 'OPEN' })
    .eq('id', sessionId)
  if (error) throw error
}

// ─── Movements API ────────────────────────────────────────────────────────────

const MOVEMENT_SELECT = '*'

export async function fetchMovements(registerId: string): Promise<CashMovement[]> {
  const { data, error } = await supabase
    .from('cash_movements')
    .select(MOVEMENT_SELECT)
    .eq('register_id', registerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as CashMovement[]) || []
}

export async function addMovement(input: AddMovementInput): Promise<CashMovement> {
  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      register_id: input.register_id,
      movement_type: input.movement_type,
      currency: input.currency,
      amount: input.amount,
      notes: input.notes || null,
      reference: input.reference || null,
      category: input.category || null,
      user_id: input.user_id,
    })
    .select(MOVEMENT_SELECT)
    .single()
  if (error) throw error
  return data as CashMovement
}
