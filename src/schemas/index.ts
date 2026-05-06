import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  price_currency_id: z.string().uuid().optional(),
  cost: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  barcode: z.string().optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  has_variants: z.boolean().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  parent_id: z.string().optional(),
  description: z.string().optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  customer_type: z.string().optional(),
  code: z.string().optional(),
  tax_id: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  credit_limit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

export const storeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  store_type: z.enum(['store', 'warehouse']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Cuba'),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  currency_id: z.string().optional(),
  invoice_prefix: z.string().optional(),
  pre_invoice_prefix: z.string().optional(),
  offer_prefix: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type StoreFormData = z.infer<typeof storeSchema>

export const teamSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type TeamFormData = z.infer<typeof teamSchema>

export const documentItemSchema = z.object({
  product_id: z.string().optional(),
  description: z.string().min(1, 'El nombre del producto es requerido'),
  sku: z.string().optional(),           // UI-only (not persisted to DB)
  available_stock: z.number().optional(), // UI-only
  quantity: z.coerce.number().min(0.001, 'La cantidad debe ser mayor a 0'),
  unit_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
})

export type DocumentItemFormData = z.infer<typeof documentItemSchema>

export const offerSchema = z.object({
  store_id: z.string().min(1, 'La tienda es requerida'),
  customer_id: z.string().optional(),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  notes: z.string().optional(),
  valid_until: z.string().optional(),
  items: z.array(documentItemSchema).min(1, 'Debe agregar al menos un item'),
})

export type OfferFormData = z.infer<typeof offerSchema>

export const invoiceSchema = z.object({
  store_id: z.string().min(1, 'La tienda es requerida'),
  customer_id: z.string().optional(),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(documentItemSchema).min(1, 'Debe agregar al menos un item'),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

export const preInvoiceSchema = z.object({
  store_id: z.string().min(1, 'La tienda es requerida'),
  customer_id: z.string().optional(),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(documentItemSchema).min(1, 'Debe agregar al menos un item'),
})

export type PreInvoiceFormData = z.infer<typeof preInvoiceSchema>

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'El nombre es requerido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  tax_id: z.string().optional(),
})

export type OrganizationFormData = z.infer<typeof organizationSchema>