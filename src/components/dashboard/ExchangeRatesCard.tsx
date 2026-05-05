import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

interface RateInfo {
  code: string
  rate: number
  change: number | null
}

async function fetchExchangeRatesSummary(organizationId: string): Promise<RateInfo[]> {
  const codes = ['EUR', 'USD', 'USDT']
  
  const { data: currencies } = await supabase
    .from('currencies')
    .select('id, code')
    .in('code', codes)

  if (!currencies?.length) return []

  const currencyIdByCode: Record<string, string> = {}
  for (const c of currencies) {
    currencyIdByCode[c.code] = c.id
  }

  const { data: rates } = await supabase
    .from('exchange_rates')
    .select('target_currency_id, rate, date')
    .eq('organization_id', organizationId)
    .eq('base_currency_id', currencyIdByCode['CUP'])
    .in('target_currency_id', codes.map(c => currencyIdByCode[c]).filter(Boolean))
    .order('date', { ascending: false })
    .limit(6)

  if (!rates?.length) return []

  const byCurrency: Record<string, { latest: number; previous: number | null; count: number }> = {}
  for (const r of rates) {
    if (!byCurrency[r.target_currency_id]) {
      byCurrency[r.target_currency_id] = { latest: 0, previous: null, count: 0 }
    }
    const bucket = byCurrency[r.target_currency_id]
    if (bucket.count === 0) {
      bucket.latest = Number(r.rate)
      bucket.count = 1
    } else if (bucket.previous === null) {
      bucket.previous = Number(r.rate)
    }
  }

  return codes
    .filter(code => currencyIdByCode[code] && byCurrency[currencyIdByCode[code]])
    .map(code => {
      const bucket = byCurrency[currencyIdByCode[code]]
      return {
        code,
        rate: bucket.latest,
        change: bucket.previous !== null
          ? ((bucket.latest - bucket.previous) / bucket.previous) * 100
          : null,
      }
    })
}

export function ExchangeRatesCard() {
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)

  const { data: rates, isLoading } = useQuery({
    queryKey: ['dashboardExchangeRates', organizationId],
    queryFn: () => fetchExchangeRatesSummary(organizationId!),
    enabled: !!organizationId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tasas de Cambio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['EUR', 'USD', 'USDT'].map(code => (
              <div key={code} className="flex items-center justify-between">
                <span className="text-sm font-medium">{code}</span>
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!rates?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tasas de Cambio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay tasas registradas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Tasas de Cambio (CUP)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rates.map((r) => (
            <div key={r.code} className="flex items-center justify-between">
              <span className="text-sm font-medium">{r.code}</span>
              <div className="flex items-center gap-2">
                {r.change !== null && (
                  <span className={`text-xs ${r.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {r.change >= 0 ? '+' : ''}{r.change.toFixed(1)}%
                  </span>
                )}
                <span className="text-sm font-semibold">{r.rate.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
