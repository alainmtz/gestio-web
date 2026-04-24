import { Input } from '@/components/ui/input'
import { CURRENCY_DENOMINATIONS, CURRENCY_SYMBOLS } from '@/lib/constants'

export type DenominationCounts = Record<number, number>

interface DenominationCounterProps {
  currency: string
  counts: DenominationCounts
  onChange: (counts: DenominationCounts) => void
}

/** Returns the total amount from denomination counts */
export function calcDenominationTotal(counts: DenominationCounts): number {
  return Object.entries(counts).reduce((sum, [denom, qty]) => {
    return sum + Number(denom) * (qty || 0)
  }, 0)
}

export function DenominationCounter({ currency, counts, onChange }: DenominationCounterProps) {
  const denominations = CURRENCY_DENOMINATIONS[currency] ?? []
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const total = calcDenominationTotal(counts)

  function handleChange(denom: number, value: string) {
    const qty = parseInt(value, 10)
    onChange({ ...counts, [denom]: isNaN(qty) || qty < 0 ? 0 : qty })
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Denominación</th>
              <th className="px-3 py-2 text-center font-medium w-24">Cantidad</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {denominations.map((denom) => {
              const qty = counts[denom] || 0
              const subtotal = denom * qty
              return (
                <tr key={denom} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">
                    {symbol}{denom.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="h-7 text-center w-20 mx-auto"
                      value={qty === 0 ? '' : qty}
                      placeholder="0"
                      onChange={(e) => handleChange(denom, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {subtotal > 0 ? `${symbol}${subtotal.toLocaleString()}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted/50 border-t-2">
            <tr>
              <td className="px-3 py-2 font-bold" colSpan={2}>Total {currency}</td>
              <td className="px-3 py-2 text-right font-bold text-lg">
                {symbol}{total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
