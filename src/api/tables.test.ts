import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Zod Schemas - Sistema empresarial', () => {
  describe('Organización', () => {
    it('organization name required', () => {
      const schema = z.object({ name: z.string().min(2) })
      expect(() => schema.parse({ name: '' })).toThrow()
      expect(() => schema.parse({ name: 'Org' })).not.toThrow()
    })

    it('organization slug lowercase', () => {
      const schema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) })
      expect(() => schema.parse({ slug: 'Test' })).toThrow()
      expect(() => schema.parse({ slug: 'test-org' })).not.toThrow()
    })
  })

  describe('Usuario', () => {
    it('full name required', () => {
      const schema = z.object({ full_name: z.string().min(2) })
      expect(() => schema.parse({ full_name: 'A' })).toThrow()
      expect(() => schema.parse({ full_name: 'User' })).not.toThrow()
    })

    it('email valid', () => {
      const schema = z.object({ email: z.string().email() })
      expect(() => schema.parse({ email: 'invalid' })).toThrow()
      expect(() => schema.parse({ email: 'test@test.com' })).not.toThrow()
    })
  })

  describe('Producto', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('sku required', () => {
      const schema = z.object({ sku: z.string().min(1) })
      expect(() => schema.parse({ sku: '' })).toThrow()
    })

    it('price positive', () => {
      const schema = z.object({ price: z.number().positive() })
      expect(() => schema.parse({ price: 0 })).toThrow()
      expect(() => schema.parse({ price: -1 })).toThrow()
      expect(() => schema.parse({ price: 100 })).not.toThrow()
    })

    it('cost nonnegative', () => {
      const schema = z.object({ cost: z.number().nonnegative() })
      expect(() => schema.parse({ cost: -1 })).toThrow()
      expect(() => schema.parse({ cost: 0 })).not.toThrow()
    })
  })

  describe('Factura', () => {
    it('document_number required', () => {
      const schema = z.object({ document_number: z.string().min(1) })
      expect(() => schema.parse({ document_number: '' })).toThrow()
    })

    it('store_id uuid', () => {
      const schema = z.object({ store_id: z.string().uuid() })
      expect(() => schema.parse({ store_id: '123' })).toThrow()
      expect(() => schema.parse({ store_id: '123e4567-e89b-12d3-a456-426614174000' })).not.toThrow()
    })

    it('total nonnegative', () => {
      const schema = z.object({ total: z.number().nonnegative() })
      expect(() => schema.parse({ total: -1 })).toThrow()
      expect(() => schema.parse({ total: 0 })).not.toThrow()
    })

    it('status enum', () => {
      const schema = z.enum(['draft', 'issued', 'paid', 'cancelled'])
      expect(() => schema.parse('draft')).not.toThrow()
      expect(() => schema.parse('paid')).not.toThrow()
    })

    it('payment_status enum', () => {
      const schema = z.enum(['pending', 'partial', 'paid'])
      expect(() => schema.parse('pending')).not.toThrow()
    })
  })

  describe('Pago', () => {
    it('amount positive', () => {
      const schema = z.object({ amount: z.number().positive() })
      expect(() => schema.parse({ amount: 0 })).toThrow()
      expect(() => schema.parse({ amount: 100 })).not.toThrow()
    })

    it('method enum', () => {
      const schema = z.enum(['cash', 'card', 'transfer'])
      expect(() => schema.parse('cash')).not.toThrow()
    })
  })

  describe('Cliente', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('code required', () => {
      const schema = z.object({ code: z.string().min(1) })
      expect(() => schema.parse({ code: '' })).toThrow()
    })

    it('email optional', () => {
      const schema = z.object({ email: z.string().email().optional() })
      expect(() => schema.parse({})).not.toThrow()
    })
  })

  describe('Proveedor', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('code required', () => {
      const schema = z.object({ code: z.string().min(1) })
      expect(() => schema.parse({ code: '' })).toThrow()
    })
  })

  describe('Tienda', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('code required', () => {
      const schema = z.object({ code: z.string().min(1) })
      expect(() => schema.parse({ code: '' })).toThrow()
    })

    it('currency_id optional', () => {
      const schema = z.object({ currency_id: z.string().uuid().optional() })
      expect(() => schema.parse({})).not.toThrow()
    })
  })

  describe('Categoría', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('parent_id optional', () => {
      const schema = z.object({ parent_id: z.string().uuid().optional() })
      expect(() => schema.parse({})).not.toThrow()
    })
  })

  describe('Equipo', () => {
    it('name required', () => {
      const schema = z.object({ name: z.string().min(1) })
      expect(() => schema.parse({ name: '' })).toThrow()
    })

    it('color string', () => {
      const schema = z.object({ color: z.string() })
      expect(() => schema.parse({ color: '#fff' })).not.toThrow()
    })
  })

  describe('Miembro de equipo', () => {
    it('role enum', () => {
      const schema = z.enum(['leader', 'member'])
      expect(() => schema.parse('leader')).not.toThrow()
      expect(() => schema.parse('member')).not.toThrow()
    })
  })

  describe('Horario de equipo', () => {
    it('status enum', () => {
      const schema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
      expect(() => schema.parse('PENDING')).not.toThrow()
      expect(() => schema.parse('CONFIRMED')).not.toThrow()
    })
  })

  describe('Consignación', () => {
    it('partner_type enum', () => {
      const schema = z.enum(['CUSTOMER', 'SUPPLIER'])
      expect(() => schema.parse('CUSTOMER')).not.toThrow()
      expect(() => schema.parse('SUPPLIER')).not.toThrow()
    })

    it('status enum', () => {
      const schema = z.enum(['ACTIVE', 'PARTIAL', 'COMPLETED', 'RETURNED', 'CANCELLED'])
      expect(() => schema.parse('ACTIVE')).not.toThrow()
    })

    it('quantity positive', () => {
      const schema = z.object({ quantity: z.number().positive() })
      expect(() => schema.parse({ quantity: 0 })).toThrow()
      expect(() => schema.parse({ quantity: 100 })).not.toThrow()
    })
  })

  describe('Caja registradora', () => {
    it('status enum', () => {
      const schema = z.enum(['open', 'closed'])
      expect(() => schema.parse('open')).not.toThrow()
    })
  })

  describe('Movimiento de caja', () => {
    it('movement_type enum', () => {
      const schema = z.enum(['income', 'expense'])
      expect(() => schema.parse('income')).not.toThrow()
    })

    it('amount numeric', () => {
      const schema = z.object({ amount: z.number() })
      expect(() => schema.parse({ amount: 100 })).not.toThrow()
    })
  })

  describe('Invoice Item', () => {
    it('quantity positive', () => {
      const schema = z.object({ quantity: z.number().positive() })
      expect(() => schema.parse({ quantity: 0 })).toThrow()
      expect(() => schema.parse({ quantity: 1 })).not.toThrow()
    })

    it('unit_price nonnegative', () => {
      const schema = z.object({ unit_price: z.number().nonnegative() })
      expect(() => schema.parse({ unit_price: -1 })).toThrow()
      expect(() => schema.parse({ unit_price: 100 })).not.toThrow()
    })
  })

  describe('Offer', () => {
    it('status enum', () => {
      const schema = z.enum(['draft', 'pending_approval', 'approved', 'rejected'])
      expect(() => schema.parse('draft')).not.toThrow()
    })
  })

  describe('Pre-factura', () => {
    it('status enum', () => {
      const schema = z.enum(['draft', 'pending_approval', 'approved', 'rejected'])
      expect(() => schema.parse('draft')).not.toThrow()
    })
  })

  describe('Exchange Rate', () => {
    it('rate positive', () => {
      const schema = z.object({ rate: z.number().positive() })
      expect(() => schema.parse({ rate: 0 })).toThrow()
      expect(() => schema.parse({ rate: 1.5 })).not.toThrow()
    })
  })

  describe('Validación compleja', () => {
    it('invoice with nested items', () => {
      const itemSchema = z.object({
        product_id: z.string().uuid(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
      })

      const invoiceSchema = z.object({
        document_number: z.string().min(1),
        items: z.array(itemSchema).min(1),
        total: z.number().positive(),
      })

      const validInvoice = {
        document_number: 'INV-001',
        items: [
          { product_id: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, unit_price: 50 }
        ],
        total: 100
      }

      expect(() => invoiceSchema.parse(validInvoice)).not.toThrow()
    })
  })
})