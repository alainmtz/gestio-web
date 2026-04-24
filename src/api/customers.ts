import { supabase } from '@/lib/supabase'

export interface Customer {
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
  customer_type?: string
  discount_percentage?: number
  price_list_id?: string
  payment_terms?: number
  credit_limit?: number
  current_balance?: number
  is_active: boolean
  tags?: string[]
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Address {
  id: string
  customer_id?: string
  supplier_id?: string
  type: 'billing' | 'shipping' | 'other'
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country: string
  is_default: boolean
  created_at: string
}

export interface Contact {
  id: string
  customer_id?: string
  supplier_id?: string
  name: string
  email?: string
  phone?: string
  position?: string
  is_primary: boolean
  created_at: string
}

export interface CreateCustomerInput {
  name: string
  customer_type?: string
  tax_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  credit_limit?: number
  tags?: string[]
  notes?: string
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  is_active?: boolean
}

export async function getCustomers(organizationId: string, options?: {
  type?: 'customer' | 'supplier'
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ customers: Customer[]; total: number }> {
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%,email.ilike.%${options.search}%,tax_id.ilike.%${options.search}%`)
  }

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return { customers: data || [], total: count || 0 }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createCustomer(organizationId: string, input: CreateCustomerInput): Promise<Customer> {
  const code = `C${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...input,
      organization_id: organizationId,
      code,
    })
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

export async function getCustomerAddresses(customerId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCustomerContacts(customerId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_primary', { ascending: false })

  if (error) throw error
  return data || []
}

export async function exportCustomersToCSV(customers: Customer[]): Promise<string> {
  const headers = ['Código', 'Nombre', 'Tipo', 'Email', 'Teléfono', 'Tax ID', 'Límite Crédito', 'Balance Actual']
  const rows = customers.map((c) => [
    c.code,
    c.name,
    c.customer_type,
    c.email || '',
    c.phone || '',
    c.tax_id || '',
    c.credit_limit?.toString() || '0',
    c.current_balance?.toString() || '0',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  return csvContent
}
