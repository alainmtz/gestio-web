import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, Plus, Lock, PauseCircle, Download, FileText } from 'lucide-react'
import { useToast } from '@/lib/toast'
import {
  useCashSession,
  useCashMovements,
  useAddMovement,
  useCloseSession,
  useSuspendSession,
} from '@/hooks/useCashRegister'
import {
  calcExpectedAmounts,
  calcDifferences,
  formatCurrencyAmounts,
} from '@/api/cashRegister'
import type { CashMovementType, CurrencyCode, CurrencyAmounts } from '@/api/cashRegister'
import { CASH_MOVEMENT_TYPE_LABELS, CURRENCY_SYMBOLS } from '@/lib/constants'
import { useLatestRatesToCupByCodes } from '@/hooks/useSettings'
import {
  DenominationCounter,
  calcDenominationTotal,
} from '@/components/ui/DenominationCounter'
import type { DenominationCounts } from '@/components/ui/DenominationCounter'
import { generateSessionPDF, generateSessionCSV } from '@/lib/cashRegisterReport'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['CUP', 'USD', 'EUR', 'MLC']

const MOVEMENT_TYPES: Array<{ value: CashMovementType; label: string }> = [
  { value: 'INCOME',     label: 'Ingreso'    },
  { value: 'EXPENSE',    label: 'Egreso'     },
  { value: 'DEPOSIT',    label: 'Depósito'   },
  { value: 'WITHDRAWAL', label: 'Extracción' },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  OPEN:      { label: 'Abierta',    variant: 'success'   },
  CLOSED:    { label: 'Cerrada',    variant: 'secondary' },
  SUSPENDED: { label: 'Suspendida', variant: 'warning'   },
}

export function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const { data: session, isLoading: loadingSession } = useCashSession(id)
  const { data: movements, isLoading: loadingMovements } = useCashMovements(id)

  const addMovementMutation = useAddMovement(id!)
  const closeSessionMutation = useCloseSession(id!)
  const suspendSessionMutation = useSuspendSession(id!)

  // ── Movement dialog state
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [movementType, setMovementType] = useState<CashMovementType>('INCOME')
  const [movementCurrency, setMovementCurrency] = useState<CurrencyCode>('CUP')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementNotes, setMovementNotes] = useState('')

  // ── Close dialog state: denomination counts per currency
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [denomCounts, setDenomCounts] = useState<Record<CurrencyCode, DenominationCounts>>({
    CUP: {}, USD: {}, EUR: {}, MLC: {},
  })

  // ─── Computed summaries ─────────────────────────────────────────────────────

  const openingAmounts: CurrencyAmounts = session?.opening_amounts ?? {}

  const expectedAmounts = movements
    ? calcExpectedAmounts(openingAmounts, movements)
    : openingAmounts

  const activeCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) => (openingAmounts[c] ?? 0) > 0 || (expectedAmounts[c] ?? 0) !== 0,
  )

  const { data: cupRatesByCode } = useLatestRatesToCupByCodes(activeCurrencies)

  const toCup = (amount: number, currency: CurrencyCode): number => {
    const rate = currency === 'CUP' ? 1 : (cupRatesByCode?.[currency] ?? 1)
    return amount * rate
  }

  const totalIncomeByCurrency: CurrencyAmounts = {}
  const totalExpenseByCurrency: CurrencyAmounts = {}

  for (const m of movements ?? []) {
    const c = m.currency ?? 'CUP'
    const amt = parseFloat(m.amount) || 0
    if (m.movement_type === 'INCOME' || m.movement_type === 'DEPOSIT') {
      totalIncomeByCurrency[c] = (totalIncomeByCurrency[c] ?? 0) + amt
    } else if (m.movement_type === 'EXPENSE' || m.movement_type === 'WITHDRAWAL') {
      totalExpenseByCurrency[c] = (totalExpenseByCurrency[c] ?? 0) + amt
    }
  }

  // Closing amounts derived from denomination counts
  const closingAmounts: CurrencyAmounts = {}
  for (const c of activeCurrencies) {
    closingAmounts[c] = calcDenominationTotal(denomCounts[c] ?? {})
  }

  const expectedTotalInCup = activeCurrencies.reduce(
    (sum, c) => sum + toCup(expectedAmounts[c] ?? 0, c),
    0,
  )

  const countedTotalInCup = activeCurrencies.reduce(
    (sum, c) => sum + toCup(closingAmounts[c] ?? 0, c),
    0,
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleAddMovement() {
    const amount = parseFloat(movementAmount)
    if (!amount || amount <= 0) return

    addMovementMutation.mutate(
      { movement_type: movementType, currency: movementCurrency, amount, notes: movementNotes },
      {
        onSuccess: () => {
          toast({ title: 'Movimiento registrado' })
          setShowMovementDialog(false)
          setMovementAmount('')
          setMovementNotes('')
        },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      },
    )
  }

  function handleCloseSession() {
    const differences = calcDifferences(closingAmounts, expectedAmounts)

    closeSessionMutation.mutate(
      { closing_amounts: closingAmounts, expected_amounts: expectedAmounts, differences },
      {
        onSuccess: () => {
          toast({ title: 'Caja cerrada', description: 'La sesión ha sido cerrada correctamente' })
          setShowCloseDialog(false)
          navigate('/cash-register/sessions')
        },
        onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      },
    )
  }

  function handleSuspend() {
    suspendSessionMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Caja suspendida', description: 'La sesión ha sido suspendida' })
        navigate('/cash-register/sessions')
      },
      onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    })
  }

  function handleExportPDF() {
    if (!session || !movements) return
    generateSessionPDF(session, movements)
  }

  function handleExportCSV() {
    if (!session || !movements) return
    generateSessionCSV(session, movements)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/cash-register/sessions">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-3xl font-bold">Sesión no encontrada</h1>
        </div>
      </div>
    )
  }

  const statusCfg = statusConfig[session.status] ?? { label: session.status, variant: 'secondary' as const }
  const isOpen = session.status === 'OPEN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/cash-register/sessions">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Sesión de Caja</h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {session.store?.name} | Cajero: {session.user?.full_name}
            </p>
          </div>
        </div>

        {isOpen && (
          <div className="flex gap-2">
            {hasPermission(PERMISSIONS.MOVEMENT_CREATE) && (
              <Button variant="outline" onClick={() => setShowMovementDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Movimiento
              </Button>
            )}
            {hasPermission(PERMISSIONS.REGISTER_CLOSE) && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSuspend}
                  disabled={suspendSessionMutation.isPending}
                >
                  {suspendSessionMutation.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <PauseCircle className="mr-2 h-4 w-4" />
                  }
                  Suspender
                </Button>
                <Button variant="destructive" onClick={() => setShowCloseDialog(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Cerrar Caja
                </Button>
              </>
            )}
          </div>
        )}
        {!isOpen && movements && movements.length > 0 && hasPermission(PERMISSIONS.REPORT_EXPORT) && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        )}
      </div>

      {/* Summary cards — one row per currency */}
      {activeCurrencies.length > 0 && (
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total esperado (referencia en CUP)</div>
              <div className="text-2xl font-bold">{CURRENCY_SYMBOLS.CUP}{expectedTotalInCup.toFixed(2)}</div>
            </CardContent>
          </Card>

          {activeCurrencies.map((c) => (
            <div key={c} className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{c} — Apertura</div>
                  <div className="text-2xl font-bold">
                    {CURRENCY_SYMBOLS[c]}{(openingAmounts[c] ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{c} — Ingresos</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{CURRENCY_SYMBOLS[c]}{(totalIncomeByCurrency[c] ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{c} — Egresos</div>
                  <div className="text-2xl font-bold text-red-600">
                    -{CURRENCY_SYMBOLS[c]}{(totalExpenseByCurrency[c] ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{c} — Esperado</div>
                  <div className="text-2xl font-bold">
                    {CURRENCY_SYMBOLS[c]}{(expectedAmounts[c] ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Movements list */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos ({movements?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMovements ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Moneda</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Notas</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movements.map((m) => {
                    const typeCfg = CASH_MOVEMENT_TYPE_LABELS[m.movement_type] ?? { label: m.movement_type, color: '', isPositive: true }
                    const symbol = CURRENCY_SYMBOLS[m.currency] ?? m.currency
                    return (
                      <tr key={m.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{new Date(m.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={typeCfg.color}>{typeCfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{m.currency}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{m.notes ?? '—'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${typeCfg.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {typeCfg.isPositive ? '+' : '-'}{symbol}{parseFloat(m.amount).toFixed(2)}
                          {m.currency !== 'CUP' && (
                            <div className="text-xs text-muted-foreground font-normal">
                              ≈ {CURRENCY_SYMBOLS.CUP}{toCup(parseFloat(m.amount) || 0, m.currency).toFixed(2)} CUP
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay movimientos</div>
          )}
        </CardContent>
      </Card>

      {/* Add movement dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={movementType} onValueChange={(v) => setMovementType(v as CashMovementType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={movementCurrency} onValueChange={(v) => setMovementCurrency(v as CurrencyCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monto ({movementCurrency})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {CURRENCY_SYMBOLS[movementCurrency]}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
                placeholder="Notas opcionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleAddMovement}
              disabled={!movementAmount || addMovementMutation.isPending}
            >
              {addMovementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close session dialog — denomination count arqueo */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arqueo de Caja</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Expected summary per currency */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm bg-muted px-3 py-2 rounded-md">
                <span className="font-medium">Total esperado en CUP:</span>
                <span>{CURRENCY_SYMBOLS.CUP}{expectedTotalInCup.toFixed(2)}</span>
                <span className="font-medium">Total contado en CUP:</span>
                <span>{CURRENCY_SYMBOLS.CUP}{countedTotalInCup.toFixed(2)}</span>
              </div>

              {activeCurrencies.map((c) => {
                const counted = closingAmounts[c] ?? 0
                const expected = expectedAmounts[c] ?? 0
                const diff = counted - expected
                return (
                  <div key={c} className="flex items-center justify-between text-sm bg-muted px-3 py-2 rounded-md">
                    <span className="font-medium">{c} esperado:</span>
                    <span>{CURRENCY_SYMBOLS[c]}{expected.toFixed(2)}</span>
                    <span className="font-medium">Contado:</span>
                    <span>{CURRENCY_SYMBOLS[c]}{counted.toFixed(2)}</span>
                    <span className={`font-bold ${diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Denomination tabs per currency */}
            {activeCurrencies.length === 1 ? (
              <DenominationCounter
                currency={activeCurrencies[0]}
                counts={denomCounts[activeCurrencies[0]] ?? {}}
                onChange={(counts) =>
                  setDenomCounts((prev) => ({ ...prev, [activeCurrencies[0]]: counts }))
                }
              />
            ) : (
              <Tabs defaultValue={activeCurrencies[0]}>
                <TabsList className="w-full">
                  {activeCurrencies.map((c) => (
                    <TabsTrigger key={c} value={c} className="flex-1">
                      {c}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeCurrencies.map((c) => (
                  <TabsContent key={c} value={c}>
                    <DenominationCounter
                      currency={c}
                      counts={denomCounts[c] ?? {}}
                      onChange={(counts) =>
                        setDenomCounts((prev) => ({ ...prev, [c]: counts }))
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleCloseSession}
              disabled={closeSessionMutation.isPending}
            >
              {closeSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
