import { supabase } from '@/lib/supabase'

export interface ProductCategory {
  id: string
  name: string
}

export interface Product {
  id: string
  organization_id: string
  store_id?: string
  category_id?: string
  sku: string
  name: string
  description?: string
  category?: ProductCategory
  cost: number
  price: number
  price_currency_id: string
  tax_rate: number
  barcode?: string
  image_url?: string
  is_active: boolean
  has_variants: boolean
  is_consignment?: boolean
  created_by?: string
  created_at: string
  updated_at: string
  totalStock?: number
}

export interface CreateProductInput {
  sku: string
  name: string
  description?: string
  category_id?: string
  cost?: number
  price: number
  price_currency_id?: string
  tax_rate?: number
  barcode?: string
  image_url?: string
  has_variants?: boolean
  initial_stock?: { store_id: string; quantity: number }[]
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean
}

export async function getProducts(organizationId: string, options?: {
  storeId?: string
  categoryId?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select('*, category:product_categories(name, id), inventory:inventory(quantity)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')

  if (options?.storeId) {
    query = query.eq('store_id', options.storeId)
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%,barcode.ilike.%${options.search}%`)
  }

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  const products = (data || []).map(p => {
    let totalStock = 0
    if (p.inventory) {
      if (Array.isArray(p.inventory)) {
        totalStock = p.inventory.reduce((sum: number, inv: { quantity: number }) => sum + (inv?.quantity || 0), 0)
      } else if (p.inventory?.quantity) {
        totalStock = p.inventory.quantity
      }
    }
    return { ...p, totalStock }
  })

  return { products, total: count || 0 }
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:product_categories(name, id)')
    .eq('id', id)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createProduct(organizationId: string, userId: string, input: CreateProductInput, defaultCurrencyId?: string): Promise<Product> {
  const { initial_stock, ...productData } = input

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      organization_id: organizationId,
      category_id: input.category_id || null,
      price_currency_id: input.price_currency_id || defaultCurrencyId || '11111111-1111-1111-1111-111111111111',
    })
    .select('*, category:product_categories(name, id)')
    .single()

  if (error) throw error

  if (initial_stock && initial_stock.length > 0) {
    for (const stock of initial_stock) {
      if (stock.quantity > 0) {
        await createMovement(organizationId, userId, {
          product_id: data.id,
          store_id: stock.store_id,
          movement_type: 'OPENING',
          quantity: stock.quantity,
          cost: input.cost || undefined,
          notes: 'Stock inicial',
        })
      }
    }
  }

  return data
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const payload: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
    category_id: input.category_id || null,
  }
  if (input.price_currency_id) {
    payload.price_currency_id = input.price_currency_id
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*, category:product_categories(name, id)')
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

export async function getCategories(organizationId: string): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}

export async function createCategory(organizationId: string, name: string, parentId?: string): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      organization_id: organizationId,
      name,
      parent_id: parentId || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string, input: { name?: string; parent_id?: string; is_active?: boolean }): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_categories')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

export type MovementType = 
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RETURN'
  | 'DAMAGE'
  | 'CONSIGNMENT_IN'
  | 'CONSIGNMENT_OUT'
  | 'OPENING'

export interface InventoryMovement {
  id: string
  organization_id: string
  store_id: string
  product_id: string
  variant_id?: string
  movement_type: MovementType
  quantity: number
  cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
  user_id?: string
  created_at: string
  product?: { id: string; name: string; sku?: string }
  store?: { id: string; name: string }
  user?: { id: string; full_name?: string }
}

export interface CreateMovementInput {
  product_id: string
  variant_id?: string
  store_id: string
  source_store_id?: string
  movement_type: MovementType
  quantity: number
  cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
}

export async function getMovements(organizationId: string, options?: {
  storeId?: string
  productId?: string
  movementType?: MovementType
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<{ movements: InventoryMovement[]; total: number }> {
  let query = supabase
    .from('inventory_movements')
    .select('*, product:products(name, sku, id), store:stores(name, id)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  const storeId = options?.storeId
  const productId = options?.productId
  const movementType = options?.movementType
  
  if (storeId && typeof storeId === 'string') {
    query = query.eq('store_id', storeId)
  }
  if (productId) {
    query = query.eq('product_id', productId)
  }
  if (movementType && typeof movementType === 'string' && !movementType.includes('all')) {
    query = query.eq('movement_type', movementType)
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  const page = options?.page || 1
  const pageSize = options?.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { movements: data || [], total: count || 0 }
}

export async function createMovement(
  organizationId: string,
  userId: string,
  input: CreateMovementInput
): Promise<InventoryMovement> {
  const { product_id, variant_id, store_id, source_store_id, movement_type, quantity, cost, reference_type, reference_id, notes } = input

  const typeMapping: Record<string, string> = {
    'PURCHASE': 'ENTRADA_COMPRA',
    'TRANSFER_IN': 'ENTRADA_AJUSTE',
    'RETURN': 'ENTRADA_DEVOLUCION',
    'CONSIGNMENT_IN': 'ENTRADA_CONSIGNACION',
    'OPENING': 'ENTRADA_INICIAL',
    'ADJUSTMENT': 'ENTRADA_AJUSTE',
    'SALE': 'SALIDA_VENTA',
    'TRANSFER_OUT': 'SALIDA_AJUSTE',
    'DAMAGE': 'SALIDA_AJUSTE',
    'CONSIGNMENT_OUT': 'SALIDA_CONSIGNACION',
  }

  const dbMovementType = typeMapping[movement_type] || movement_type

  const { data: movementData, error: moveError } = await supabase.rpc('handle_inventory_movement', {
    p_organization_id: organizationId,
    p_store_id: store_id,
    p_product_id: product_id,
    p_variant_id: variant_id ?? null,
    p_movement_type: dbMovementType,
    p_quantity: quantity,
    p_cost: cost ?? null,
    p_reference_type: reference_type ?? null,
    p_reference_id: reference_id ?? null,
    p_notes: notes ?? null,
    p_user_id: userId,
  })

  if (moveError) throw moveError

  const { data: createdMovement } = await supabase
    .from('inventory_movements')
    .select('*, product:products(name, sku, id), store:stores(name, id)')
    .eq('id', movementData)
    .single()

  if (movement_type === 'CONSIGNMENT_IN') {
    await supabase
      .from('products')
      .update({ is_consignment: true })
      .eq('id', product_id)
  }

  return createdMovement
}

export interface UpdateMovementInput {
  movement_type?: MovementType
  quantity?: number
  cost?: number
  notes?: string
  store_id?: string
  reference_type?: string
  reference_id?: string
  userId?: string
  organizationId?: string
}

async function resolveOrgForMovement(
  movementId: string,
  productId: string,
  inputOrgId?: string
): Promise<string> {
  if (inputOrgId) return inputOrgId
  const { data: m } = await supabase.from('inventory_movements').select('organization_id').eq('id', movementId).single()
  if (m?.organization_id) return m.organization_id
  const { data: p } = await supabase.from('products').select('organization_id').eq('id', productId).single()
  if (p?.organization_id) return p.organization_id
  throw new Error('Cannot resolve organization_id for movement update')
}

async function getEffectiveStock(orgId: string, productId: string, storeId: string, variantId: string | null): Promise<number> {
  const { data: rows } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('organization_id', orgId)
    .eq('product_id', productId)
    .eq('store_id', storeId)
    .eq('variant_id', variantId)
  return (rows ?? []).reduce((sum, r) => sum + Number(r.quantity), 0)
}

async function upsertInventoryDelta(
  orgId: string, productId: string, storeId: string, variantId: string | null, delta: number
): Promise<void> {
  const currentStock = await getEffectiveStock(orgId, productId, storeId, variantId)
  const newQty = currentStock + delta
  if (newQty < 0) {
    throw new Error(`Stock insuficiente. Stock actual: ${currentStock}, intento: ${delta}`)
  }

  const { data: existing } = await supabase
    .from('inventory')
    .select('id')
    .eq('organization_id', orgId)
    .eq('product_id', productId)
    .eq('store_id', storeId)
    .eq('variant_id', variantId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('inventory')
      .insert({ organization_id: orgId, product_id: productId, store_id: storeId, variant_id: variantId, quantity: newQty })
    if (error) throw error
  }
}

const OUTPUT_TYPES = new Set(['SALE', 'TRANSFER_OUT', 'DAMAGE', 'CONSIGNMENT_OUT'])

function computeStockDelta(movementType: string, quantity: number): number {
  return OUTPUT_TYPES.has(movementType) ? -quantity : quantity
}

export async function updateMovement(
  id: string,
  input: UpdateMovementInput
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('inventory_movements')
    .select('id, quantity, product_id, store_id, movement_type, cost, notes, reference_type, reference_id, variant_id')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const storeChanged = input.store_id !== undefined && input.store_id !== current.store_id
  const effectiveStoreId = storeChanged ? input.store_id! : current.store_id
  const effectiveQty = input.quantity ?? current.quantity
  const effectiveType = input.movement_type ?? current.movement_type
  const variantId = current.variant_id ?? null
  const orgId = await resolveOrgForMovement(id, current.product_id, input.organizationId)

  if (input.quantity !== undefined || storeChanged) {
    if (storeChanged) {
      const oldDelta = -computeStockDelta(current.movement_type, current.quantity)
      await upsertInventoryDelta(orgId, current.product_id, current.store_id, variantId, oldDelta)
      const newDelta = computeStockDelta(effectiveType, effectiveQty)
      await upsertInventoryDelta(orgId, current.product_id, effectiveStoreId, variantId, newDelta)
    } else if (input.quantity !== undefined && input.quantity !== current.quantity) {
      const oldDelta = computeStockDelta(current.movement_type, current.quantity)
      const newDelta = computeStockDelta(effectiveType, effectiveQty)
      await upsertInventoryDelta(orgId, current.product_id, current.store_id, variantId, newDelta - oldDelta)
    }
  }

  const { error: updateError } = await supabase
    .from('inventory_movements')
    .update({
      ...(input.movement_type !== undefined && { movement_type: input.movement_type }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(storeChanged && { store_id: input.store_id }),
      ...(input.reference_type !== undefined && { reference_type: input.reference_type }),
      ...(input.reference_id !== undefined && { reference_id: input.reference_id }),
    })
    .eq('id', id)
  if (updateError) throw updateError

  if (input.userId) {
    const oldData = {
      store_id: current.store_id,
      movement_type: current.movement_type,
      quantity: current.quantity,
      cost: current.cost,
      notes: current.notes,
      reference_type: current.reference_type,
      reference_id: current.reference_id,
    }
    const newData = {
      store_id: effectiveStoreId,
      movement_type: effectiveType,
      quantity: effectiveQty,
      cost: input.cost ?? current.cost,
      notes: input.notes ?? current.notes,
      reference_type: input.reference_type ?? current.reference_type,
      reference_id: input.reference_id ?? current.reference_id,
    }
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: input.userId,
      table_name: 'inventory_movements',
      record_id: id,
      action: 'UPDATE',
      old_data: oldData,
      new_data: newData,
    })
  }
}
