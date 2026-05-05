import { supabase } from '@/lib/supabase'

// The eltoque-proxy Edge Function is deployed on the remote/cloud Supabase instance.
// When running locally against Docker, we call the function directly via the remote URL
// so that Edge Functions work regardless of the local VITE_SUPABASE_URL setting.
const REMOTE_FUNCTIONS_URL = 'https://mdyyeaangivbfowmnnrp.supabase.co/functions/v1'
const REMOTE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keXllYWFuZ2l2YmZvd21ubnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDU0ODYsImV4cCI6MjA4NDQyMTQ4Nn0.BiliXzINbZaWZm4l5SNzOkvqtS7ShnvwpNp1zw0QFcc'

export interface ElToqueRateResponse {
  date: string
  hour: string
  tasas: Record<string, number>
}

export interface ElToqueToken {
  id: string
  organization_id: string
  token: string
  provider: string
  created_at: string
}

export async function getElToqueToken(organizationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_eltoque_tokens')
    .select('token')
    .eq('organization_id', organizationId)
    .eq('provider', 'eltoque')
    .maybeSingle()

  if (error) throw error
  return data?.token || null
}

export async function saveElToqueToken(organizationId: string, token: string): Promise<void> {
  const existing = await supabase
    .from('organization_eltoque_tokens')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('provider', 'eltoque')
    .maybeSingle()

  if (existing.data) {
    const { error } = await supabase
      .from('organization_eltoque_tokens')
      .update({ token, updated_at: new Date().toISOString() })
      .eq('id', existing.data.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('organization_eltoque_tokens')
      .insert({
        organization_id: organizationId,
        token,
        provider: 'eltoque',
      })
    if (error) throw error
  }
}

export async function fetchElToqueRates(token: string): Promise<ElToqueRateResponse> {
  const response = await fetch(`${REMOTE_FUNCTIONS_URL}/eltoque-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': REMOTE_ANON_KEY,
    },
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo contactar el proxy de ElToque.`)
  }

  const data = await response.json()

  if (data?.error) {
    throw new Error(`Error de ElToque: ${data.error}`)
  }

  return data as ElToqueRateResponse
}

export async function syncFromElToque(organizationId: string): Promise<number> {
  const token = await getElToqueToken(organizationId)
  
  if (!token) {
    throw new Error('Token de ElToque no configurado. Configure el token en Settings.')
  }

  const eltoqueData = await fetchElToqueRates(token)
  const rawRates = eltoqueData.tasas

  // Normaliza códigos recibidos y permite alias conocidos desde ElToque.
  const normalizedRates: Record<string, number> = {}
  for (const [rawCode, rawRate] of Object.entries(rawRates)) {
    const code = rawCode.trim().toUpperCase()
      .replace('USDT_TRC20', 'USDT')
    if (typeof rawRate === 'number' && rawRate > 0) {
      normalizedRates[code] = rawRate
    }
  }

  // Si EUR no viene explícito pero existe ECU, se usa ECU como aproximación para EUR.
  if (!normalizedRates.EUR && normalizedRates.ECU) {
    normalizedRates.EUR = normalizedRates.ECU
  }

  const requestedCodes = Array.from(new Set(['CUP', ...Object.keys(normalizedRates)]))

  const { data: currencies, error: currenciesError } = await supabase
    .from('currencies')
    .select('id, code')
    .in('code', requestedCodes)

  if (currenciesError) throw currenciesError
  
  const currencyIdMap: Record<string, string> = {}
  currencies?.forEach(c => {
    currencyIdMap[c.code] = c.id
  })

  const cupCurrencyId = currencyIdMap['CUP']
  if (!cupCurrencyId) {
    throw new Error('Moneda CUP no encontrada en la base de datos.')
  }

  const ratesToInsert = []
  const date = eltoqueData.date

  for (const [code, rate] of Object.entries(normalizedRates)) {
    const currencyId = currencyIdMap[code]
    if (currencyId && rate > 0 && code !== 'CUP') {
      ratesToInsert.push({
        organization_id: organizationId,
        base_currency_id: cupCurrencyId,
        target_currency_id: currencyId,
        rate: rate,
        source: 'eltoque',
        date: date,
      })
    }
  }

  if (ratesToInsert.length === 0) {
    throw new Error('No se recibieron tasas válidas de ElToque.')
  }

  let totalUpdated = 0
  for (const rate of ratesToInsert) {
    const { data: existing } = await supabase
      .from('exchange_rates')
      .select('id')
      .eq('organization_id', rate.organization_id)
      .eq('base_currency_id', rate.base_currency_id)
      .eq('target_currency_id', rate.target_currency_id)
      .eq('date', rate.date)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('exchange_rates')
        .update({ rate: rate.rate, source: rate.source })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('exchange_rates')
        .insert(rate)
      if (error) throw error
    }
    totalUpdated++
  }

  return totalUpdated
}