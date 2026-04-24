import { supabase } from '@/lib/supabase'
import { createMovement } from './products'

// ─── Helper ───────────────────────────────────────────────────────────────────
function calcItemTotals(item: {
  quantity: number
  unit_price: number
  tax_rate?: number
  discount_percentage?: number
}) {
  const subtotal = item.quantity * item.unit_price
  const discountAmt = subtotal * ((item.discount_percentage || 0) / 100)
  const taxAmount = subtotal * ((item.tax_rate || 0) / 100)
  const total = subtotal - discountAmt + taxAmount
  return { subtotal, taxAmount, total, discountAmt }
}

async function getCupCurrencyId(): Promise<string> {
  const { data, error } = await supabase
    .from('currencies')
    .select('id')
    .eq('code', 'CUP')
    .single()

  if (error) throw error
  return data.id
}

async function resolveExchangeRateToCup(
  organizationId: string,
  currencyId: string,
  providedRate?: number,
): Promise<number> {
  if (providedRate && providedRate > 0) return providedRate

  const cupCurrencyId = await getCupCurrencyId()
  if (currencyId === cupCurrencyId) return 1

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('organization_id', organizationId)
    .eq('base_currency_id', cupCurrencyId)
    .eq('target_currency_id', currencyId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.rate ?? 1
}

// ─── Offer ────────────────────────────────────────────────────────────────────
export interface OfferItem {
  id: string
  offer_id: string
  line_number: number
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
}

export interface Offer {
  id: string
  organization_id: string
  store_id: string
  customer_id?: string
  number: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  rejection_reason?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  currency_id: string
  exchange_rate?: number
  notes?: string
  valid_until?: string
  created_by?: string
  created_at: string
  updated_at: string
  customer?: { name: string; code: string }
  items?: OfferItem[]
}

export interface CreateOfferInput {
  store_id: string
  customer_id?: string
  currency_id: string
  exchange_rate?: number
  notes?: string
  valid_until?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

// ─── PreInvoice ───────────────────────────────────────────────────────────────
export interface PreInvoiceItem {
  id: string
  pre_invoice_id: string
  line_number: number
  product_id?: string
  variant_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
}

export interface PreInvoice {
  id: string
  organization_id: string
  store_id: string
  customer_id?: string
  offer_id?: string
  number: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  rejection_reason?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  currency_id: string
  exchange_rate?: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  customer?: { name: string; code: string }
  items?: PreInvoiceItem[]
}

export interface CreatePreInvoiceInput {
  store_id: string
  customer_id?: string
  currency_id: string
  exchange_rate?: number
  offer_id?: string
  notes?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  id: string
  invoice_id: string
  line_number: number
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
}

export interface InvoicePayment {
  id: string
  invoice_id: string
  amount: number
  payment_method: string
  reference?: string
  notes?: string
  recorded_by?: string
  created_at: string
}

export interface Invoice {
  id: string
  organization_id: string
  store_id: string
  customer_id?: string
  offer_id?: string
  pre_invoice_id?: string
  number: string
  status: 'draft' | 'issued' | 'paid' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'paid'
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  paid_amount: number
  currency_id: string
  exchange_rate?: number
  due_date?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  customer?: { name: string; code: string }
  items?: InvoiceItem[]
  payments?: InvoicePayment[]
}

export interface CreateInvoiceInput {
  store_id: string
  customer_id?: string
  currency_id: string
  exchange_rate?: number
  offer_id?: string
  due_date?: string
  notes?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

// ─── Offer CRUD ───────────────────────────────────────────────────────────────
export async function getOffers(organizationId: string, options?: {
  storeId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ offers: Offer[]; total: number }> {
  let query = supabase
    .from('offers')
    .select('*, customer:customers(name, code)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.storeId) query = query.eq('store_id', options.storeId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.ilike('number', `%${options.search}%`)

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize

  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { offers: data || [], total: count || 0 }
}

export async function getOffer(id: string): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('offers')
    .select('*, customer:customers(name, code), items:offer_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createOffer(organizationId: string, userId: string, input: CreateOfferInput): Promise<Offer> {
  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount
  const exchangeRate = await resolveExchangeRateToCup(organizationId, input.currency_id, input.exchange_rate)

  const { count } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `OFERTA-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      organization_id: organizationId,
      store_id: input.store_id,
      customer_id: input.customer_id || null,
      number,
      status: 'draft',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      currency_id: input.currency_id,
      exchange_rate: exchangeRate,
      notes: input.notes || null,
      valid_until: input.valid_until || null,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('offer_items').insert(itemRows.map((r) => ({ ...r, offer_id: offer.id })))
  return { ...offer, items: itemRows as unknown as OfferItem[] }
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────
export async function getInvoices(organizationId: string, options?: {
  storeId?: string
  status?: string
  paymentStatus?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ invoices: Invoice[]; total: number }> {
  let query = supabase
    .from('invoices')
    .select('*, customer:customers(name, code)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.storeId) query = query.eq('store_id', options.storeId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.paymentStatus) query = query.eq('payment_status', options.paymentStatus)
  if (options?.search) query = query.ilike('number', `%${options.search}%`)

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize

  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { invoices: data || [], total: count || 0 }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(name, code), items:invoice_items(*), payments(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createInvoice(organizationId: string, userId: string, input: CreateInvoiceInput): Promise<Invoice> {
  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount
  const exchangeRate = await resolveExchangeRateToCup(organizationId, input.currency_id, input.exchange_rate)

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `FACT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      store_id: input.store_id,
      customer_id: input.customer_id || null,
      offer_id: input.offer_id || null,
      number,
      status: 'issued',
      payment_status: 'pending',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      paid_amount: 0,
      currency_id: input.currency_id,
      exchange_rate: exchangeRate,
      due_date: input.due_date || null,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) throw error

  if (itemRows.length > 0) {
    await supabase.from('invoice_items').insert(itemRows.map((r) => ({ ...r, invoice_id: invoice.id })))
  }

  for (const item of itemRows) {
    if (item.product_id) {
      await createMovement(organizationId, userId, {
        store_id: input.store_id,
        product_id: item.product_id,
        variant_id: undefined,
        movement_type: 'SALE',
        quantity: item.quantity,
        cost: item.unit_price,
        reference_type: 'invoice',
        reference_id: invoice.id,
        notes: `Venta - Factura ${number}`,
      })
    }
  }

  return invoice
}

export async function addInvoicePayment(invoiceId: string, userId: string, amount: number, method: string, reference?: string): Promise<InvoicePayment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount,
      payment_method: method,
      reference: reference || null,
    })
    .select()
    .single()

  if (error) throw error

  const invoice = await getInvoice(invoiceId)
  if (invoice) {
    const newPaid = invoice.paid_amount + amount
    const newStatus = newPaid >= invoice.total ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
    await supabase
      .from('invoices')
      .update({ paid_amount: newPaid, payment_status: newStatus })
      .eq('id', invoiceId)
  }

  return data
}

// ─── PreInvoice CRUD ──────────────────────────────────────────────────────────
export async function getPreInvoices(organizationId: string, options?: {
  storeId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ preInvoices: PreInvoice[]; total: number }> {
  let query = supabase
    .from('pre_invoices')
    .select('*, customer:customers(name, code)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.storeId) query = query.eq('store_id', options.storeId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.ilike('number', `%${options.search}%`)

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize

  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { preInvoices: data || [], total: count || 0 }
}

export async function getPreInvoice(id: string): Promise<PreInvoice | null> {
  const { data, error } = await supabase
    .from('pre_invoices')
    .select('*, customer:customers(name, code), items:pre_invoice_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createPreInvoice(organizationId: string, userId: string, input: CreatePreInvoiceInput): Promise<PreInvoice> {
  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount
  const exchangeRate = await resolveExchangeRateToCup(organizationId, input.currency_id, input.exchange_rate)

  const { count } = await supabase
    .from('pre_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `PRE-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: preInvoice, error } = await supabase
    .from('pre_invoices')
    .insert({
      organization_id: organizationId,
      store_id: input.store_id,
      customer_id: input.customer_id || null,
      offer_id: input.offer_id || null,
      number,
      status: 'draft',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      currency_id: input.currency_id,
      exchange_rate: exchangeRate,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('pre_invoice_items').insert(itemRows.map((r) => ({ ...r, pre_invoice_id: preInvoice.id })))
  return { ...preInvoice, items: itemRows as unknown as PreInvoiceItem[] }
}

export async function rejectPreInvoice(preInvoiceId: string, reason: string): Promise<void> {
  await supabase.from('pre_invoices').update({
    status: 'rejected',
    rejection_reason: reason,
  }).eq('id', preInvoiceId)
}

// ─── Conversion helpers ───────────────────────────────────────────────────────
export interface UpdateOfferInput {
  store_id?: string
  customer_id?: string
  currency_id?: string
  notes?: string
  valid_until?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

export async function updateOffer(offerId: string, input: UpdateOfferInput): Promise<void> {
  const existingOffer = await getOffer(offerId)
  if (!existingOffer) throw new Error('Offer not found')

  const nextCurrencyId = input.currency_id ?? existingOffer.currency_id
  const exchangeRate = await resolveExchangeRateToCup(existingOffer.organization_id, nextCurrencyId)

  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount

  const { error } = await supabase
    .from('offers')
    .update({
      store_id: input.store_id,
      customer_id: input.customer_id || null,
      currency_id: input.currency_id,
      exchange_rate: exchangeRate,
      notes: input.notes || null,
      valid_until: input.valid_until || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
    })
    .eq('id', offerId)

  if (error) throw error

  await supabase.from('offer_items').delete().eq('offer_id', offerId)
  if (itemRows.length > 0) {
    await supabase.from('offer_items').insert(itemRows.map((r) => ({ ...r, offer_id: offerId })))
  }
}

export interface UpdatePreInvoiceInput {
  store_id?: string
  customer_id?: string
  currency_id?: string
  exchange_rate?: number
  notes?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

export async function updatePreInvoice(preInvoiceId: string, input: UpdatePreInvoiceInput): Promise<void> {
  const existingPreInvoice = await getPreInvoice(preInvoiceId)
  if (!existingPreInvoice) throw new Error('Pre-invoice not found')

  const nextCurrencyId = input.currency_id ?? existingPreInvoice.currency_id
  const exchangeRate = await resolveExchangeRateToCup(
    existingPreInvoice.organization_id,
    nextCurrencyId,
    input.exchange_rate,
  )

  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount

  const { error } = await supabase
    .from('pre_invoices')
    .update({
      store_id: input.store_id,
      customer_id: input.customer_id || null,
      currency_id: input.currency_id,
      exchange_rate: exchangeRate,
      notes: input.notes || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
    })
    .eq('id', preInvoiceId)

  if (error) throw error

  await supabase.from('pre_invoice_items').delete().eq('pre_invoice_id', preInvoiceId)
  if (itemRows.length > 0) {
    await supabase.from('pre_invoice_items').insert(itemRows.map((r) => ({ ...r, pre_invoice_id: preInvoiceId })))
  }
}

export async function approvePreInvoice(preInvoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('pre_invoices')
    .update({ status: 'approved' })
    .eq('id', preInvoiceId)
  if (error) throw error
}

export async function submitPreInvoiceForApproval(preInvoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('pre_invoices')
    .update({ status: 'pending_approval' })
    .eq('id', preInvoiceId)
  if (error) throw error
}

export interface UpdateInvoiceInput {
  customer_id?: string
  due_date?: string
  notes?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_percentage?: number
  }[]
}

export async function updateInvoice(invoiceId: string, organizationId: string, userId: string, input: UpdateInvoiceInput): Promise<void> {
  // Only allow editing draft invoices
  const existing = await getInvoice(invoiceId)
  if (!existing) throw new Error('Invoice not found')
  if (existing.status !== 'draft') throw new Error('Solo se pueden editar facturas en borrador')

  let subtotal = 0, taxAmount = 0, discountAmount = 0

  const itemRows = input.items.map((item, idx) => {
    const c = calcItemTotals(item)
    subtotal += c.subtotal
    taxAmount += c.taxAmount
    discountAmount += c.discountAmt
    return {
      line_number: idx + 1,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      tax_rate: item.tax_rate || 0,
      subtotal: c.subtotal,
      tax_amount: c.taxAmount,
      total: c.total,
    }
  })

  const total = subtotal - discountAmount + taxAmount

  const { error } = await supabase
    .from('invoices')
    .update({
      customer_id: input.customer_id || null,
      due_date: input.due_date || null,
      notes: input.notes || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
    })
    .eq('id', invoiceId)

  if (error) throw error

  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
  if (itemRows.length > 0) {
    await supabase.from('invoice_items').insert(itemRows.map((r) => ({ ...r, invoice_id: invoiceId })))
  }
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('id', invoiceId)
  if (error) throw error
}

export async function rejectOffer(offerId: string, reason: string): Promise<void> {
  await supabase.from('offers').update({
    status: 'rejected',
    rejection_reason: reason,
  }).eq('id', offerId)
}

export async function convertOfferToPreInvoice(offerId: string, organizationId: string, userId: string): Promise<PreInvoice> {
  const offer = await getOffer(offerId)
  if (!offer) throw new Error('Offer not found')

  const { count } = await supabase
    .from('pre_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `PRE-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const exchangeRate = await resolveExchangeRateToCup(
    organizationId,
    offer.currency_id,
    offer.exchange_rate,
  )

  const { data: preInvoice, error } = await supabase
    .from('pre_invoices')
    .insert({
      organization_id: organizationId,
      store_id: offer.store_id,
      customer_id: offer.customer_id || null,
      offer_id: offer.id,
      number,
      status: 'approved',
      subtotal: offer.subtotal,
      tax_amount: offer.tax_amount,
      discount_amount: offer.discount_amount,
      total: offer.total,
      currency_id: offer.currency_id,
      exchange_rate: exchangeRate,
      notes: offer.notes,
    })
    .select()
    .single()

  if (error) throw error

  if (offer.items) {
    await supabase.from('pre_invoice_items').insert(
      offer.items.map((item, idx) => ({
        pre_invoice_id: preInvoice.id,
        line_number: item.line_number ?? idx + 1,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        tax_rate: item.tax_rate || 0,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total,
      }))
    )
  }

  await supabase.from('offers').update({ status: 'sent' }).eq('id', offerId)
  return preInvoice
}

export async function convertOfferToInvoice(offerId: string, organizationId: string, userId: string): Promise<Invoice> {
  const offer = await getOffer(offerId)
  if (!offer) throw new Error('Offer not found')

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `FACT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const exchangeRate = await resolveExchangeRateToCup(
    organizationId,
    offer.currency_id,
    offer.exchange_rate,
  )

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      store_id: offer.store_id,
      customer_id: offer.customer_id || null,
      offer_id: offer.id,
      number,
      status: 'issued',
      payment_status: 'pending',
      subtotal: offer.subtotal,
      tax_amount: offer.tax_amount,
      discount_amount: offer.discount_amount,
      total: offer.total,
      paid_amount: 0,
      currency_id: offer.currency_id,
      exchange_rate: exchangeRate,
    })
    .select()
    .single()

  if (error) throw error

  if (offer.items) {
    await supabase.from('invoice_items').insert(
      offer.items.map((item, idx) => ({
        invoice_id: invoice.id,
        line_number: item.line_number ?? idx + 1,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        tax_rate: item.tax_rate || 0,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total,
      }))
    )

    for (const item of offer.items) {
      if (item.product_id) {
        await createMovement(organizationId, userId, {
          store_id: offer.store_id,
          product_id: item.product_id,
          variant_id: undefined,
          movement_type: 'SALE',
          quantity: item.quantity,
          cost: item.unit_price,
          reference_type: 'invoice',
          reference_id: invoice.id,
          notes: `Venta desde oferta ${offer.number}`,
        })
      }
    }
  }

  await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
  return invoice
}

export async function convertPreInvoiceToInvoice(preInvoiceId: string, organizationId: string, userId: string): Promise<Invoice> {
  const preInvoice = await getPreInvoice(preInvoiceId)
  if (!preInvoice) throw new Error('Pre-invoice not found')
  if (preInvoice.status !== 'approved') throw new Error('Pre-invoice must be approved to convert')

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const number = `FACT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const exchangeRate = await resolveExchangeRateToCup(
    organizationId,
    preInvoice.currency_id,
    preInvoice.exchange_rate,
  )

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      store_id: preInvoice.store_id,
      customer_id: preInvoice.customer_id || null,
      offer_id: preInvoice.offer_id || null,
      pre_invoice_id: preInvoice.id,
      number,
      status: 'issued',
      payment_status: 'pending',
      subtotal: preInvoice.subtotal,
      tax_amount: preInvoice.tax_amount,
      discount_amount: preInvoice.discount_amount,
      total: preInvoice.total,
      paid_amount: 0,
      currency_id: preInvoice.currency_id,
      exchange_rate: exchangeRate,
      notes: preInvoice.notes,
    })
    .select()
    .single()

  if (error) throw error

  if (preInvoice.items) {
    await supabase.from('invoice_items').insert(
      preInvoice.items.map((item, idx) => ({
        invoice_id: invoice.id,
        line_number: item.line_number ?? idx + 1,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        tax_rate: item.tax_rate || 0,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total,
      }))
    )

    for (const item of preInvoice.items) {
      if (item.product_id) {
        await createMovement(organizationId, userId, {
          store_id: preInvoice.store_id,
          product_id: item.product_id,
          variant_id: item.variant_id || undefined,
          movement_type: 'SALE',
          quantity: item.quantity,
          cost: item.unit_price,
          reference_type: 'invoice',
          reference_id: invoice.id,
          notes: `Venta desde pre-factura ${preInvoice.number}`,
        })
      }
    }
  }

  return invoice
}
