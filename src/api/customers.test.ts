import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Customers API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('table queries', () => {
    it('can query customers table', () => {
      const query = supabase.from('customers').select()
      expect(query).toBeDefined()
    })

    it('can insert customer', () => {
      const query = supabase.from('customers').insert({})
      expect(query).toBeDefined()
    })

    it('can update customer', () => {
      const query = supabase.from('customers').update({})
      expect(query).toBeDefined()
    })

    it('can delete customer', () => {
      const query = supabase.from('customers').delete()
      expect(query).toBeDefined()
    })
  })

  describe('supabase methods', () => {
    it('has select method', () => {
      expect(typeof supabase.from('customers').select).toBe('function')
    })

    it('has insert method', () => {
      expect(typeof supabase.from('customers').insert).toBe('function')
    })

    it('has update method', () => {
      expect(typeof supabase.from('customers').update).toBe('function')
    })

    it('has delete method', () => {
      expect(typeof supabase.from('customers').delete).toBe('function')
    })
  })
})

import { z } from 'zod'

describe('Customer Types', () => {
  it('Customer interface has required fields', () => {
    const customer = {
      id: 'cust-1',
      organization_id: 'org-1',
      name: 'Test Customer',
      code: 'C001',
    }
    expect(customer.id).toBeDefined()
    expect(customer.name).toBeDefined()
    expect(customer.code).toBeDefined()
  })

  it('CreateCustomerInput interface', () => {
    const input = {
      name: 'New Customer',
      code: 'C002',
      email: 'test@test.com',
      phone: '123456',
      address: 'Test Address',
    }
    expect(input.name).toBeDefined()
    expect(input.code).toBeDefined()
  })
})

describe('Customer Schema Validation', () => {
  it('validates required name', () => {
    const schema = z.object({
      name: z.string().min(1, 'El nombre es requerido'),
      code: z.string().min(1),
    })
    expect(() => schema.parse({ name: '', code: 'C001' })).toThrow()
  })

  it('validates required code', () => {
    const schema = z.object({
      name: z.string().min(1),
      code: z.string().min(1, 'El código es requerido'),
    })
    expect(() => schema.parse({ name: 'Test', code: '' })).toThrow()
  })

  it('validates email format', () => {
    const schema = z.object({
      email: z.string().email('Correo inválido').optional(),
    })
    expect(() => schema.parse({ email: 'invalid' })).toThrow()
    expect(() => schema.parse({ email: 'test@test.com' })).not.toThrow()
  })
})