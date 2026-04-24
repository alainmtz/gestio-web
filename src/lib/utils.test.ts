import { describe, it, expect, vi } from 'vitest'
import { cn, formatCurrency, formatDate, formatDateTime, generateCode, debounce, sleep } from './utils'

describe('cn', () => {
  it('combina nombres de clase', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('maneja clases condicionales', () => {
    expect(cn('foo', undefined, 'baz')).toBe('foo baz')
  })

  it('maneja arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('maneja objetos', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })
})

describe('formatCurrency', () => {
  it('formatea numero como moneda', () => {
    const result = formatCurrency(100)
    expect(result).toMatch(/\d+/)
  })

  it('formatea string como moneda', () => {
    const result = formatCurrency('250.50')
    expect(result).toMatch(/\d+/)
  })
})

describe('formatDate', () => {
  it('formatea fecha', () => {
    const result = formatDate('2024-03-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('soporta formato largo', () => {
    const result = formatDate('2024-03-15', 'long')
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('formatea fecha y hora', () => {
    const result = formatDateTime('2024-03-15T14:30:00')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateCode', () => {
  it('genera codigo con prefijo', () => {
    expect(generateCode('TEST', '1234567890ab')).toBe('TEST-123456')
  })
})

describe('debounce', () => {
  it('retorna funcion envuelta', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)
    expect(typeof debouncedFn).toBe('function')
  })
})

describe('sleep', () => {
  it('resuelve despues del tiempo especificado', async () => {
    const start = Date.now()
    await sleep(10)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(5)
  })
})