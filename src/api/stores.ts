import { supabase } from '@/lib/supabase'

export type StoreType = 'store' | 'warehouse'

export interface Store {
  id: string
  organization_id: string
  name: string
  code: string
  store_type: StoreType
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  currency_id?: string
  invoice_prefix?: string
  pre_invoice_prefix?: string
  offer_prefix?: string
  is_active: boolean
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateStoreInput {
  name: string
  code: string
  store_type?: StoreType
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  currency_id?: string
  invoice_prefix?: string
  pre_invoice_prefix?: string
  offer_prefix?: string
}

export interface UpdateStoreInput extends Partial<CreateStoreInput> {
  is_active?: boolean
  config?: Record<string, unknown>
}

export async function getStores(organizationId: string, options?: { includeInactive?: boolean }): Promise<Store[]> {
  let query = supabase
    .from('stores')
    .select('*, currency:currencies(code)')
    .eq('organization_id', organizationId)
    .order('name')

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  // Add currency code to store object
  return (data || []).map(store => ({
    ...store,
    currency_id: store.currency?.code || store.currency_id,
  }))
}

export async function getStore(id: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*, currency:currencies(code)')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  if (data?.currency?.code) {
    data.currency_id = data.currency.code
  }
  return data
}

async function getCurrencyByCode(code: string): Promise<string | null> {
  if (!code) return null
  
  // Check if it's already a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
    return code
  }
  
  // Look up currency by code
  const { data: existing, error } = await supabase
    .from('currencies')
    .select('id')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  
  if (error || !existing) {
    return null
  }
  
  return existing.id
}

export async function createStore(organizationId: string, input: CreateStoreInput): Promise<Store> {
  // Convert currency code to UUID
  let currencyId: string | null = null
  if (input.currency_id) {
    currencyId = await getCurrencyByCode(input.currency_id)
  }
  
  const cleanInput = { ...input, currency_id: currencyId }
  
  const { data, error } = await supabase
    .from('stores')
    .insert({
      ...cleanInput,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function updateStore(id: string, input: UpdateStoreInput): Promise<Store> {
  // Convert currency code to UUID if provided
  let currencyId: string | null = null
  if (input.currency_id) {
    currencyId = await getCurrencyByCode(input.currency_id)
  }
  
  const cleanInput = {
    ...input,
    currency_id: currencyId,
  }
  
  const { data, error } = await supabase
    .from('stores')
    .update(cleanInput)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function deleteStore(id: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

export async function getUserStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('user_stores')
    .select(`
      stores (
        *
      )
    `)
    .eq('user_id', userId)

  if (error) throw error
  return (data || []).map((us) => us.stores as unknown as Store)
}
