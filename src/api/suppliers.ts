import { supabase } from '@/lib/supabase'

export interface Supplier {
  id: string
  organization_id: string
  code: string
  name: string
  tax_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  payment_terms?: number
  credit_limit?: number
  current_balance?: number
  is_active: boolean
  is_global?: boolean
  tags?: string[]
  created_at: string
  updated_at: string
  stores?: { id: string; name: string }[]
}

export interface CreateSupplierInput {
  name: string
  tax_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  payment_terms?: number
  credit_limit?: number
  is_global?: boolean
  store_ids?: string[]
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  is_active?: boolean
}

export async function getSuppliers(organizationId: string, options?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ suppliers: Supplier[]; total: number }> {
  let query = supabase
    .from('suppliers')
    .select('*, stores:supplier_stores(store:stores(id, name))', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%`)
  }

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error
  
  const suppliers = (data || []).map(s => ({
    ...s,
    stores: s.stores?.map((st: any) => st.store).filter(Boolean) || []
  }))
  
  return { suppliers, total: count || 0 }
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createSupplier(organizationId: string, input: CreateSupplierInput): Promise<Supplier> {
  const code = `S${Date.now().toString(36).toUpperCase()}`
  const { store_ids, is_global, ...supplierData } = input
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplierData, organization_id: organizationId, code, is_global: is_global || false })
    .select()
    .single()

  if (error) throw error
  
  const supplier = data
  
  if (store_ids && store_ids.length > 0) {
    const supplierStores = store_ids.map(store_id => ({
      supplier_id: supplier.id,
      store_id,
      organization_id: organizationId,
      is_global: is_global || false,
    }))
    await supabase.from('supplier_stores').insert(supplierStores)
  }
  
  return supplier
}

export async function updateSupplier(id: string, input: UpdateSupplierInput & { store_ids?: string[]; is_global?: boolean }): Promise<Supplier> {
  const { store_ids, is_global, ...supplierData } = input
  
  const { data, error } = await supabase
    .from('suppliers')
    .update({ ...supplierData, updated_at: new Date().toISOString(), is_global })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  if (store_ids !== undefined) {
    await supabase.from('supplier_stores').delete().eq('supplier_id', id)
    
    if (store_ids.length > 0) {
      const { data: orgData } = await supabase.from('suppliers').select('organization_id').eq('id', id).maybeSingle()
      const supplierStores = store_ids.map(store_id => ({
        supplier_id: id,
        store_id,
        organization_id: orgData?.organization_id,
        is_global: is_global || false,
      }))
      await supabase.from('supplier_stores').insert(supplierStores)
    }
  }
  
  return data
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}