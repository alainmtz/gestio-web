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
  tax_rate: number
  barcode?: string
  image_url?: string
  is_active: boolean
  has_variants: boolean
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
  tax_rate?: number
  barcode?: string
  image_url?: string
  has_variants?: boolean
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

export async function createProduct(organizationId: string, input: CreateProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...input,
      organization_id: organizationId,
    })
    .select('*, category:product_categories(name, id)')
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
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

export async function updateMovement(
  id: string,
  input: UpdateMovementInput
): Promise<void> {
  // Fetch current movement for delta/audit
  const { data: current, error: fetchError } = await supabase
    .from('inventory_movements')
    .select('quantity, product_id, store_id, movement_type, cost, notes, reference_type, reference_id')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const storeChanged = input.store_id !== undefined && input.store_id !== current.store_id

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

  const effectiveStoreId = storeChanged ? input.store_id! : current.store_id

  // Adjust inventory when quantity or store changes
  if (input.quantity !== undefined || storeChanged) {
    const newQty = input.quantity !== undefined ? input.quantity : current.quantity

    if (storeChanged) {
      // Remove quantity from old store inventory
      const { data: oldInv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', current.product_id)
        .eq('store_id', current.store_id)
        .maybeSingle()
      if (oldInv) {
        await supabase
          .from('inventory')
          .update({ quantity: Math.max(0, oldInv.quantity - current.quantity) })
          .eq('id', oldInv.id)
      }

      // Add quantity to new store inventory (upsert)
      const { data: newInv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', current.product_id)
        .eq('store_id', effectiveStoreId)
        .maybeSingle()
      if (newInv) {
        await supabase
          .from('inventory')
          .update({ quantity: newInv.quantity + newQty })
          .eq('id', newInv.id)
      } else {
        // Get organization_id from product if not provided
        let orgId = input.organizationId
        if (!orgId) {
          const { data: prod } = await supabase
            .from('products')
            .select('organization_id')
            .eq('id', current.product_id)
            .single()
          orgId = prod?.organization_id
        }
        await supabase.from('inventory').insert({
          product_id: current.product_id,
          store_id: effectiveStoreId,
          organization_id: orgId,
          quantity: newQty,
        })
      }
    } else if (input.quantity !== undefined && input.quantity !== current.quantity) {
      // Only quantity changed, same store
      const delta = input.quantity - current.quantity
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', current.product_id)
        .eq('store_id', current.store_id)
        .maybeSingle()
      if (inv) {
        await supabase
          .from('inventory')
          .update({ quantity: inv.quantity + delta })
          .eq('id', inv.id)
      }
    }
  }

  // Audit log
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
      movement_type: input.movement_type ?? current.movement_type,
      quantity: input.quantity ?? current.quantity,
      cost: input.cost ?? current.cost,
      notes: input.notes ?? current.notes,
      reference_type: input.reference_type ?? current.reference_type,
      reference_id: input.reference_id ?? current.reference_id,
    }
    await supabase.from('audit_logs').insert({
      organization_id: input.organizationId ?? null,
      user_id: input.userId,
      table_name: 'inventory_movements',
      record_id: id,
      action: 'UPDATE',
      old_data: oldData,
      new_data: newData,
    })
  }
}
