import { useState, useMemo } from 'react'
import { useCurrencies, useExchangeRates, useExchangeRateHistory, useCreateExchangeRate, useDeleteExchangeRate } from '@/hooks/useSettings'
import { useElToqueToken, useSyncFromElToque, useSaveElToqueToken } from '@/hooks/useElToque'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowRightLeft, Plus, Trash2, RefreshCw, Key, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { showErrorToast } from '@/lib/errorToast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export function ExchangeRatesPage() {
  const [baseCurrency, setBaseCurrency] = useState<string>('')
  const [targetCurrency, setTargetCurrency] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [elToqueToken, setElToqueToken] = useState('')
  const [formData, setFormData] = useState({
    baseCurrencyId: '',
    targetCurrencyId: '',
    rate: '',
    date: new Date().toISOString().split('T')[0],
  })

  const { hasPermission } = usePermissions()
  const { data: currencies } = useCurrencies()
  const { data: rates, isLoading: ratesLoading } = useExchangeRates({
    baseCurrencyId: baseCurrency || undefined,
    targetCurrencyId: targetCurrency || undefined,
  })
  const { data: historyRates, isLoading: historyLoading } = useExchangeRateHistory(7)
  const createRate = useCreateExchangeRate()
  const deleteRate = useDeleteExchangeRate()
  const { data: savedToken } = useElToqueToken()
  const syncFromElToque = useSyncFromElToque()
  const saveToken = useSaveElToqueToken()
  const { toast } = useToast()

  const hasToken = !!savedToken

  const filteredRates = rates?.filter((r) => {
    if (baseCurrency && r.base_currency_id !== baseCurrency) return false
    if (targetCurrency && r.target_currency_id !== targetCurrency) return false
    return true
  }) || []

  const chartData = useMemo(() => {
    if (!historyRates || !currencies) return { rows: [], pairKeys: [], pairLabels: new Map<string, string>() }

    const currencyCodeById = new Map(currencies.map((c) => [c.id, c.code]))

    const groupedByPair = new Map<string, { date: string; baseCode: string; targetCode: string; rate: number; timestamp: number }[]>()
    const pairLabels = new Map<string, string>()
    for (const r of historyRates) {
      const baseCode = r.base_currency?.code ?? currencyCodeById.get(r.base_currency_id) ?? ''
      const targetCode = r.target_currency?.code ?? currencyCodeById.get(r.target_currency_id) ?? ''
      const pairKey = `${r.base_currency_id}|${r.target_currency_id}`
      if (!groupedByPair.has(pairKey)) {
        groupedByPair.set(pairKey, [])
        pairLabels.set(pairKey, `${baseCode} → ${targetCode}`)
      }
      groupedByPair.get(pairKey)!.push({
        date: r.date,
        baseCode,
        targetCode,
        rate: r.rate,
        timestamp: new Date(r.date).getTime(),
      })
    }

    const allDates = [...new Set(historyRates.map((r) => r.date))].sort()
    const pairEntries = Array.from(groupedByPair.entries())

    return {
      rows: allDates.map((date) => {
        const entry: Record<string, string | number> = { date }
        for (const [pairKey, points] of pairEntries) {
          const point = points.find((p) => p.date === date)
          if (point) {
            entry[pairKey] = point.rate
          }
        }
        return entry
      }),
      pairKeys: pairEntries.map(([k]) => k),
      pairLabels,
    }
  }, [historyRates, currencies])

  const pairColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  const handleCreate = async () => {
    if (!formData.baseCurrencyId || !formData.targetCurrencyId || !formData.rate || !formData.date) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' })
      return
    }
    if (formData.baseCurrencyId === formData.targetCurrencyId) {
      toast({ title: 'Error', description: 'Las monedas deben ser diferentes', variant: 'destructive' })
      return
    }

    try {
      await createRate.mutateAsync({
        base_currency_id: formData.baseCurrencyId,
        target_currency_id: formData.targetCurrencyId,
        rate: parseFloat(formData.rate),
        date: formData.date,
      })
      setDialogOpen(false)
      setFormData({
        baseCurrencyId: '',
        targetCurrencyId: '',
        rate: '',
        date: new Date().toISOString().split('T')[0],
      })
      toast({ title: 'Tasa creada', description: 'La tasa de cambio se ha creado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo crear la tasa.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteRate.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: 'Tasa eliminada', description: 'La tasa de cambio se ha eliminado.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo eliminar la tasa.')
    }
  }

  const handleSyncFromElToque = async () => {
    try {
      const count = await syncFromElToque.mutateAsync()
      toast({ title: 'Sincronización exitosa', description: `${count} tasas actualizadas desde ElToque`, variant: 'default' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo sincronizar desde ElToque')
    }
  }

  const handleSaveToken = async () => {
    if (!elToqueToken.trim()) {
      toast({ title: 'Error', description: 'Ingrese un token válido', variant: 'destructive' })
      return
    }
    try {
      await saveToken.mutateAsync(elToqueToken)
      setTokenDialogOpen(false)
      setElToqueToken('')
      toast({ title: 'Token guardado', description: 'Token de ElToque configurado correctamente', variant: 'default' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo guardar el token')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasas de Cambio</h1>
          <p className="text-muted-foreground">Gestión de tasas de cambio por moneda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission(PERMISSIONS.SETTINGS_EXCHANGE) && (
            <Button
              variant="outline"
              onClick={() => setTokenDialogOpen(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              {hasToken ? 'Token Configurado' : 'Configurar Token'}
            </Button>
          )}
          {hasPermission(PERMISSIONS.SETTINGS_EXCHANGE) && hasToken && (
            <Button
              variant="outline"
              onClick={handleSyncFromElToque}
              disabled={syncFromElToque.isPending}
            >
              {syncFromElToque.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar ElToque
            </Button>
          )}
          {hasPermission(PERMISSIONS.SETTINGS_EXCHANGE) && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tasa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Tasa de Cambio</DialogTitle>
                <DialogDescription>
                  Agrega una nueva tasa de cambio entre dos monedas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda Base</Label>
                    <Select
                      value={formData.baseCurrencyId}
                      onValueChange={(v) => setFormData({ ...formData, baseCurrencyId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda Objetivo</Label>
                    <Select
                      value={formData.targetCurrencyId}
                      onValueChange={(v) => setFormData({ ...formData, targetCurrencyId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tasa</Label>
                    <Input
                      type="number"
                      step="0.0000000001"
                      placeholder="1.0000"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createRate.isPending}>
                  {createRate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Tasa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={baseCurrency || 'all'} onValueChange={(v) => setBaseCurrency(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Moneda Base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {currencies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={targetCurrency || 'all'} onValueChange={(v) => setTargetCurrency(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Moneda Objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {currencies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chartData.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Historial de Tasas (7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(d: string) => {
                      const parts = d.split('-')
                      return `${parts[1]}/${parts[2]}`
                    }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      value.toFixed(4),
                      chartData.pairLabels.get(name) ?? name,
                    ]}
                    labelFormatter={(label: string) => `Fecha: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(name: string) => chartData.pairLabels.get(name) ?? name}
                  />
                  {chartData.pairKeys.map((pairKey, i) => (
                    <Area
                      key={pairKey}
                      type="monotone"
                      dataKey={pairKey}
                      stroke={pairColors[i % pairColors.length]}
                      fill={pairColors[i % pairColors.length]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={pairKey}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Tasas de Cambio ({filteredRates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredRates.length > 0 ? (
            <div className="divide-y">
              {filteredRates.map((rate) => (
                <div key={rate.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {rate.base_currency?.code} → {rate.target_currency?.code}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        {rate.date} · {rate.source === 'eltoque' && (
                          <Badge variant="secondary">ElToque</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    <div className="text-right">
                      <p className="font-medium">{rate.rate.toFixed(4)}</p>
                    </div>
                    {hasPermission(PERMISSIONS.SETTINGS_EXCHANGE) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(rate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay tasas de cambio. Crea una o sincroniza desde ElToque.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Tasa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta tasa de cambio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token de ElToque</DialogTitle>
            <DialogDescription>
              Configure su token de API para sincronizar tasas automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Ingrese su token de la API de ElToque para sincronizar automáticamente las tasas de cambio.
            </p>
            <div className="space-y-2">
              <Label>Token</Label>
              <Input
                type="password"
                placeholder="tok_xxxxx..."
                value={elToqueToken}
                onChange={(e) => setElToqueToken(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveToken} disabled={saveToken.isPending}>
              {saveToken.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Token
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}