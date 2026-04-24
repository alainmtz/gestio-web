import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Eye, Loader2, ArrowRight, PauseCircle, PlayCircle } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { useStores } from '@/hooks/useStores'
import {
  useCashSessions,
  useActiveSession,
  useOpenSession,
  useResumeSession,
} from '@/hooks/useCashRegister'
import { formatCurrencyAmounts } from '@/api/cashRegister'
import type { CashSession, CurrencyAmounts } from '@/api/cashRegister'
import { CURRENCY_SYMBOLS } from '@/lib/constants'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const SUPPORTED_CURRENCIES: Array<{ code: keyof CurrencyAmounts; label: string }> = [
  { code: 'CUP', label: 'CUP' },
  { code: 'USD', label: 'USD' },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  OPEN:      { label: 'Abierta',    variant: 'success'   },
  CLOSED:    { label: 'Cerrada',    variant: 'secondary' },
  SUSPENDED: { label: 'Suspendida', variant: 'warning'   },
}

export function SessionsPage() {
  const { toast } = useToast()
  const { data: storesData } = useStores()
  const { hasPermission } = usePermissions()

  const { data: sessions, isLoading } = useCashSessions()
  const { data: activeSession } = useActiveSession()
  const openSessionMutation = useOpenSession()

  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [openingAmounts, setOpeningAmounts] = useState<Record<string, string>>({ CUP: '', USD: '' })

  const hasOpenSession = !!activeSession

  function handleOpenSession() {
    if (!selectedStoreId) return

    const amounts: CurrencyAmounts = {}
    for (const [code, val] of Object.entries(openingAmounts)) {
      const n = parseFloat(val)
      if (!isNaN(n) && n >= 0) amounts[code as keyof CurrencyAmounts] = n
    }

    if (Object.keys(amounts).length === 0) {
      amounts.CUP = 0
    }

    openSessionMutation.mutate(
      { store_id: selectedStoreId, opening_amounts: amounts },
      {
        onSuccess: () => {
          toast({ title: 'Caja abierta', description: 'La sesión de caja se ha iniciado correctamente' })
          setShowOpenDialog(false)
          setOpeningAmounts({ CUP: '', USD: '' })
          setSelectedStoreId('')
        },
        onError: (err: Error) => {
          toast({ title: 'Error', description: err.message, variant: 'destructive' })
        },
      },
    )
  }

  const suspendedSessions = sessions?.filter((s) => s.status === 'SUSPENDED') ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">Sesiones de caja registradora</p>
        </div>
        {!hasOpenSession ? (
          hasPermission(PERMISSIONS.REGISTER_OPEN) && (
            <Button onClick={() => setShowOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Abrir Caja
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-sm py-2">Caja Abierta</Badge>
            <Link to={`/cash-register/sessions/${activeSession!.id}`}>
              <Button variant="outline">
                Ver Sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Active session banner */}
      {hasOpenSession && activeSession && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">Sesión activa</p>
                <p className="font-medium">{activeSession.store?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Inicio: {new Date(activeSession.opened_at).toLocaleString()}
                </p>
                <p className="text-sm font-medium mt-1">
                  Apertura: {formatCurrencyAmounts(activeSession.opening_amounts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suspended sessions notice */}
      {!hasOpenSession && suspendedSessions.length > 0 && (
        <div className="space-y-2">
          {suspendedSessions.map((s) => (
            <SuspendedSessionBanner key={s.id} session={s} />
          ))}
        </div>
      )}

      {/* Sessions table */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Cajero</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tienda</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Apertura</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.map((s) => {
                    const cfg = statusConfig[s.status] ?? { label: s.status, variant: 'secondary' as const }
                    return (
                      <tr key={s.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{s.user?.full_name ?? s.user_id}</td>
                        <td className="px-4 py-3">{s.store?.name ?? s.store_id}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrencyAmounts(s.opening_amounts)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(s.opened_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/cash-register/sessions/${s.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones de caja
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open session dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tienda</Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Montos de apertura</Label>
              {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-14 text-sm font-medium text-muted-foreground">{label}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {CURRENCY_SYMBOLS[code]}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      placeholder="0.00"
                      value={openingAmounts[code] ?? ''}
                      onChange={(e) =>
                        setOpeningAmounts((prev) => ({ ...prev, [code]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleOpenSession}
              disabled={!selectedStoreId || openSessionMutation.isPending}
            >
              {openSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Abrir Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Suspended session banner ────────────────────────────────────────────────

function SuspendedSessionBanner({ session }: { session: CashSession }) {
  const { toast } = useToast()
  const resumeMutation = useResumeSession(session.id)

  function handleResume() {
    resumeMutation.mutate(undefined, {
      onSuccess: () => toast({ title: 'Caja reanudada', description: 'La sesión ha sido reanudada' }),
      onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    })
  }

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Sesión suspendida — {session.store?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Apertura: {formatCurrencyAmounts(session.opening_amounts)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleResume} disabled={resumeMutation.isPending}>
              {resumeMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><PlayCircle className="mr-1 h-4 w-4" /> Reanudar</>
              }
            </Button>
            <Link to={`/cash-register/sessions/${session.id}`}>
              <Button size="sm" variant="ghost">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
