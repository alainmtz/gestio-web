import { supabase } from '@/lib/supabase'

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  created_at: string
}

export interface ExchangeRate {
  id: string
  organization_id: string
  base_currency_id: string
  target_currency_id: string
  rate: number
  source: string
  date: string
  created_at: string
  base_currency?: Currency
  target_currency?: Currency
}

export async function getCurrencies(): Promise<Currency[]> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_active', true)
    .order('code')

  if (error) throw error
  return data || []
}

export interface GetExchangeRatesParams {
  organizationId: string
  baseCurrencyId?: string
  targetCurrencyId?: string
  startDate?: string
  endDate?: string
}

export async function getExchangeRates(params: GetExchangeRatesParams): Promise<ExchangeRate[]> {
  const { organizationId, baseCurrencyId, targetCurrencyId, startDate, endDate } = params

  let query = supabase
    .from('exchange_rates')
    .select('*, base_currency:currencies!base_currency_id(code, name, symbol), target_currency:currencies!target_currency_id(code, name, symbol)')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })

  if (baseCurrencyId) {
    query = query.eq('base_currency_id', baseCurrencyId)
  }
  if (targetCurrencyId) {
    query = query.eq('target_currency_id', targetCurrencyId)
  }
  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error

  const latestByPair = new Map<string, ExchangeRate>()
  for (const rate of data || []) {
    const key = `${rate.base_currency_id}-${rate.target_currency_id}`
    if (!latestByPair.has(key)) {
      latestByPair.set(key, rate)
    }
  }

  return Array.from(latestByPair.values())
}

export interface CreateExchangeRateInput {
  base_currency_id: string
  target_currency_id: string
  rate: number
  date: string
  source?: string
}

export async function createExchangeRate(
  organizationId: string,
  input: CreateExchangeRateInput
): Promise<ExchangeRate> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .insert({
      organization_id: organizationId,
      ...input,
    })
    .select('*, base_currency:currencies!base_currency_id(code, name, symbol), target_currency:currencies!target_currency_id(code, name, symbol)')
    .single()

  if (error) throw error
  return data
}

export async function updateExchangeRate(
  id: string,
  input: { rate: number; date: string }
): Promise<ExchangeRate> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .update(input)
    .eq('id', id)
    .select('*, base_currency:currencies!base_currency_id(code, name, symbol), target_currency:currencies!target_currency_id(code, name, symbol)')
    .single()

  if (error) throw error
  return data
}

export async function deleteExchangeRate(id: string): Promise<void> {
  const { error } = await supabase
    .from('exchange_rates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getLatestExchangeRate(
  organizationId: string,
  baseCurrencyId: string,
  targetCurrencyId: string
): Promise<ExchangeRate | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*, base_currency:currencies!base_currency_id(code, name, symbol), target_currency:currencies!target_currency_id(code, name, symbol)')
    .eq('organization_id', organizationId)
    .eq('base_currency_id', baseCurrencyId)
    .eq('target_currency_id', targetCurrencyId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getLatestRatesToCupByCodes(
  organizationId: string,
  codes: string[],
): Promise<Record<string, number>> {
  const normalizedCodes = Array.from(
    new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean)),
  )

  if (normalizedCodes.length === 0) return {}

  const requestedCodes = Array.from(new Set(['CUP', ...normalizedCodes]))

  const { data: currencies, error: currenciesError } = await supabase
    .from('currencies')
    .select('id, code')
    .in('code', requestedCodes)

  if (currenciesError) throw currenciesError

  const currencyIdByCode: Record<string, string> = {}
  for (const c of currencies || []) {
    currencyIdByCode[c.code] = c.id
  }

  const cupCurrencyId = currencyIdByCode.CUP
  if (!cupCurrencyId) return {}

  const targetIds = normalizedCodes
    .map((code) => currencyIdByCode[code])
    .filter((id): id is string => Boolean(id) && id !== cupCurrencyId)

  const ratesByTargetId: Record<string, number> = {}

  if (targetIds.length > 0) {
    const { data: rates, error: ratesError } = await supabase
      .from('exchange_rates')
      .select('target_currency_id, rate, date')
      .eq('organization_id', organizationId)
      .eq('base_currency_id', cupCurrencyId)
      .in('target_currency_id', targetIds)
      .order('date', { ascending: false })

    if (ratesError) throw ratesError

    for (const r of rates || []) {
      if (!(r.target_currency_id in ratesByTargetId)) {
        ratesByTargetId[r.target_currency_id] = Number(r.rate)
      }
    }
  }

  const result: Record<string, number> = {}
  for (const code of normalizedCodes) {
    if (code === 'CUP') {
      result[code] = 1
      continue
    }

    const targetId = currencyIdByCode[code]
    result[code] = targetId ? (ratesByTargetId[targetId] ?? 1) : 1
  }

  return result
}