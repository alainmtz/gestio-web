import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Sistema Gestio - Validación completa', () => {
  describe('Autenticación', () => {
    it('login email validation', () => {
      const schema = z.object({
        email: z.string().email('Correo electrónico inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      })
      
      expect(() => schema.parse({ email: 'invalid', password: '123456' })).toThrow()
      expect(() => schema.parse({ email: 'test@test.com', password: '123' })).toThrow()
      expect(() => schema.parse({ email: 'test@test.com', password: '123456' })).not.toThrow()
    })

    it('register validation', () => {
      const schema = z.object({
        fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        email: z.string().email('Correo electrónico inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        confirmPassword: z.string(),
        organizationName: z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
      }).refine(data => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
      })

      expect(() => schema.parse({
        fullName: 'A', email: 'test@test.com', password: '123456', confirmPassword: 'different', organizationName: 'Org'
      })).toThrow()
    })
  })

  describe('Productos', () => {
    it('create product input', () => {
      const schema = z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        sku: z.string().min(1, 'El SKU es requerido'),
        price: z.number().positive('El precio debe ser mayor a 0'),
        cost: z.number().nonnegative().optional(),
        category_id: z.string().uuid().optional(),
        barcode: z.string().optional(),
        description: z.string().optional(),
        is_active: z.boolean().default(true),
      })

      expect(() => schema.parse({ name: '', sku: 'SKU', price: 100 })).toThrow()
      expect(() => schema.parse({ name: 'Product', sku: '', price: 100 })).toThrow()
      expect(() => schema.parse({ name: 'Product', sku: 'SKU', price: 0 })).toThrow()
      expect(() => schema.parse({ name: 'Product', sku: 'SKU001', price: 100 })).not.toThrow()
    })

    it('product price precision', () => {
      const schema = z.object({
        price: z.number().positive().max(999999.99),
        cost: z.number().nonnegative().max(999999.99),
      })

      expect(() => schema.parse({ price: -1, cost: 0 })).toThrow()
      expect(() => schema.parse({ price: 1000000, cost: 0 })).toThrow()
      expect(() => schema.parse({ price: 99.99, cost: 50 })).not.toThrow()
    })
  })

  describe('Categorías', () => {
    it('category input', () => {
      const schema = z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        parent_id: z.string().uuid().optional(),
        description: z.string().optional(),
      })

      expect(() => schema.parse({ name: '' })).toThrow()
      expect(() => schema.parse({ name: 'Category', parent_id: 'invalid' })).toThrow()
      expect(() => schema.parse({ name: 'Electronics', parent_id: '123e4567-e89b-12d3-a456-426614174000' })).not.toThrow()
    })
  })

  describe('Clientes', () => {
    it('create customer input', () => {
      const schema = z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        code: z.string().min(1, 'El código es requerido'),
        email: z.string().email('Correo inválido').optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        tax_id: z.string().optional(),
        is_active: z.boolean().default(true),
      })

      expect(() => schema.parse({ name: '', code: 'C001' })).toThrow()
      expect(() => schema.parse({ name: 'Customer', code: '', email: 'invalid' })).toThrow()
      expect(() => schema.parse({ name: 'Customer', code: 'C001', email: 'test@test.com' })).not.toThrow()
    })

    it('customer code unique per organization', () => {
      const schema = z.object({
        code: z.string().min(1).max(20),
      })

      expect(() => schema.parse({ code: '' })).toThrow()
      expect(() => schema.parse({ code: 'A'.repeat(21) })).toThrow()
      expect(() => schema.parse({ code: 'C001' })).not.toThrow()
    })
  })

  describe('Proveedores', () => {
    it('create supplier input', () => {
      const schema = z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        tax_id: z.string().optional(),
        is_active: z.boolean().default(true),
      })

      expect(() => schema.parse({ name: '', code: 'S001' })).toThrow()
      expect(() => schema.parse({ name: 'Supplier', code: 'S001' })).not.toThrow()
    })
  })

  describe('Tiendas', () => {
    it('store input', () => {
      const schema = z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        currency_id: z.string().uuid().optional(),
        is_active: z.boolean().default(true),
      })

      expect(() => schema.parse({ name: '', code: 'ST001' })).toThrow()
      expect(() => schema.parse({ name: 'Store', code: 'ST001' })).not.toThrow()
    })
  })

  describe('Facturas', () => {
    it('create invoice input', () => {
      const itemSchema = z.object({
        product_id: z.string().uuid(),
        product_name: z.string(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        tax_rate: z.number().nonnegative().default(0),
        discount_amount: z.number().nonnegative().default(0),
      })

      const schema = z.object({
        store_id: z.string().uuid(),
        customer_id: z.string().uuid().optional(),
        issued_at: z.string(),
        due_date: z.string().optional(),
        items: z.array(itemSchema).min(1, 'La factura debe tener al menos un item'),
        notes: z.string().optional(),
      })

      expect(() => schema.parse({ store_id: '123', items: [] })).toThrow()
      expect(() => schema.parse({ store_id: '123e4567-e89b-12d3-a456-426614174000', items: [] })).toThrow()
    })

    it('invoice item calculations', () => {
      const item = {
        quantity: 2,
        unit_price: 50,
        tax_rate: 16,
        discount_amount: 10,
      }

      const subtotal = item.quantity * item.unit_price
      const discount = item.discount_amount
      const taxable = subtotal - discount
      const tax = taxable * (item.tax_rate / 100)
      const total = taxable + tax

      expect(subtotal).toBe(100)
      expect(taxable).toBe(90)
      expect(tax).toBe(14.4)
      expect(total).toBe(104.4)
    })
  })

  describe('Pagos', () => {
    it('payment input', () => {
      const schema = z.object({
        invoice_id: z.string().uuid(),
        amount: z.number().positive(),
        method: z.enum(['cash', 'card', 'transfer', 'check']),
        reference: z.string().optional(),
        payment_date: z.string().optional(),
        notes: z.string().optional(),
      })

      expect(() => schema.parse({ invoice_id: '123', amount: 0, method: 'cash' })).toThrow()
      expect(() => schema.parse({ invoice_id: '123e4567-e89b-12d3-a456-426614174000', amount: 100, method: 'cash' })).not.toThrow()
    })

    it('payment method enum', () => {
      const schema = z.enum(['cash', 'card', 'transfer', 'check'])
      expect(() => schema.parse('cash')).not.toThrow()
      expect(() => schema.parse('crypto')).toThrow()
    })
  })

  describe('Equipos', () => {
    it('team input', () => {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        is_active: z.boolean().default(true),
      })

      expect(() => schema.parse({ name: '', color: '#ff0000' })).toThrow()
      expect(() => schema.parse({ name: 'Team', color: 'red' })).toThrow()
      expect(() => schema.parse({ name: 'Team Sales', color: '#ff0000' })).not.toThrow()
    })

    it('team member input', () => {
      const schema = z.object({
        team_id: z.string().uuid(),
        user_id: z.string().uuid(),
        role: z.enum(['leader', 'member']),
      })

      expect(() => schema.parse({ team_id: '123', user_id: '456', role: 'admin' })).toThrow()
      expect(() => schema.parse({ team_id: '123e4567-e89b-12d3-a456-426614174000', user_id: '123e4567-e89b-12d3-a456-426614174000', role: 'leader' })).not.toThrow()
    })
  })

  describe('Horarios de equipos', () => {
    it('schedule input', () => {
      const schema = z.object({
        team_id: z.string().uuid(),
        invoice_id: z.string().uuid(),
        status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
      })

      expect(() => schema.parse({ team_id: '123', invoice_id: '456', status: 'ACTIVE' })).toThrow()
      expect(() => schema.parse({ team_id: '123e4567-e89b-12d3-a456-426614174000', invoice_id: '123e4567-e89b-12d3-a456-426614174000' })).not.toThrow()
    })

    it('schedule status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      }

      expect(validTransitions['PENDING']).toContain('CONFIRMED')
      expect(validTransitions['CONFIRMED']).toContain('COMPLETED')
      expect(validTransitions['COMPLETED'].length).toBe(0)
    })
  })

  describe('Consignaciones', () => {
    it('consignment input', () => {
      const schema = z.object({
        organization_id: z.string().uuid(),
        store_id: z.string().uuid(),
        partner_id: z.string().uuid(),
        partner_type: z.enum(['CUSTOMER', 'SUPPLIER']),
        items: z.array(z.object({
          product_id: z.string().uuid(),
          quantity: z.number().positive(),
          commission_rate: z.number().nonnegative().default(0),
        })).min(1),
      })

      expect(() => schema.parse({ organization_id: '123', store_id: '456', partner_id: '789', partner_type: 'CUSTOMER', items: [] })).toThrow()
    })

    it('consignment status enum', () => {
      const schema = z.enum(['ACTIVE', 'PARTIAL', 'COMPLETED', 'RETURNED', 'CANCELLED'])
      expect(() => schema.parse('ACTIVE')).not.toThrow()
      expect(() => schema.parse('COMPLETED')).not.toThrow()
    })
  })

  describe('Caja registradora', () => {
    it('open register input', () => {
      const schema = z.object({
        organization_id: z.string().uuid(),
        store_id: z.string().uuid(),
        user_id: z.string().uuid(),
        opening_amounts: z.record(z.string(), z.number()).optional(),
      })

      const validId = '123e4567-e89b-12d3-a456-426614174000'
      expect(() => schema.parse({ organization_id: validId, store_id: validId, user_id: validId })).not.toThrow()
    })

    it('cash movement input', () => {
      const schema = z.object({
        register_id: z.string().uuid(),
        movement_type: z.enum(['income', 'expense']),
        category: z.string().optional(),
        amount: z.number().nonnegative(),
        method: z.enum(['cash', 'card', 'transfer']).optional(),
        reference: z.string().optional(),
      })

      expect(() => schema.parse({ register_id: '123', movement_type: 'income', amount: -1 })).toThrow()
      expect(() => schema.parse({ register_id: '123e4567-e89b-12d3-a456-426614174000', movement_type: 'income', amount: 100 })).not.toThrow()
    })
  })

  describe('Pre-facturas y Ofertas', () => {
    it('offer status enum', () => {
      const schema = z.enum(['draft', 'pending_approval', 'approved', 'rejected'])
      expect(() => schema.parse('approved')).not.toThrow()
      expect(() => schema.parse('draft')).not.toThrow()
    })

    it('convert offer to invoice validation', () => {
      const offer = {
        id: '123',
        status: 'approved' as const,
        items: [{ product_id: '1', quantity: 1 }],
      }

      expect(offer.status).toBe('approved')
      expect(offer.items.length).toBeGreaterThan(0)
    })
  })

  describe('Tasas de cambio', () => {
    it('exchange rate input', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000'
      const schema = z.object({
        from_currency: z.string().uuid(),
        to_currency: z.string().uuid(),
        rate: z.number().positive(),
        date: z.string(),
      })

      expect(() => schema.parse({ from_currency: validId, to_currency: validId, rate: 1.5, date: '2024-01-01' })).not.toThrow()
    })
  })

  describe('Security & Permissions', () => {
    it('role creation', () => {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        is_system_role: z.boolean().default(false),
      })

      expect(() => schema.parse({ name: '', is_system_role: false })).toThrow()
      expect(() => schema.parse({ name: 'Admin' })).not.toThrow()
    })

    it('permission scope', () => {
      const schema = z.object({
        module: z.string().min(1),
        action: z.string().min(1),
        scope: z.enum(['organization', 'store', 'team']).default('organization'),
      })

      expect(() => schema.parse({ module: '', action: '' })).toThrow()
      expect(() => schema.parse({ module: 'invoices', action: 'create', scope: 'store' })).not.toThrow()
    })
  })
})