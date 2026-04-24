import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { storeSchema, type StoreFormData } from '@/schemas'
import { getStore, createStore, updateStore, deleteStore } from '@/api/stores'
import { getCurrencies } from '@/api/settings'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

export function StoreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()

  const isNew = !id || id === 'new'
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ['store', id],
    queryFn: () => getStore(id!),
    enabled: !isNew && !!id,
  })

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: getCurrencies,
    enabled: true,
  })

  const createMutation = useMutation({
    mutationFn: (data: StoreFormData) => createStore(organizationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast({ title: 'Tienda creada', description: 'La tienda se ha creado correctamente', variant: 'default' })
      navigate('/stores')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: StoreFormData) => updateStore(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', id] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast({ title: 'Tienda actualizada', description: 'Los cambios se han guardado correctamente', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteStore(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast({ title: 'Tienda eliminada', description: 'La tienda se ha eliminado correctamente', variant: 'default' })
      navigate('/stores')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      code: '',
      store_type: 'store' as const,
      country: 'Cuba',
      currency_id: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        code: store.code,
        store_type: (store.store_type as 'store' | 'warehouse') || 'store',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        country: store.country || 'Cuba',
        postal_code: store.postal_code || '',
        phone: store.phone || '',
        email: store.email || '',
        currency_id: store.currency_id || '',
        invoice_prefix: store.invoice_prefix || '',
        pre_invoice_prefix: store.pre_invoice_prefix || '',
        offer_prefix: store.offer_prefix || '',
        is_active: store.is_active,
      })
    }
  }, [store, reset])

  const onSubmit = async (data: StoreFormData) => {
    if (isNew) {
      await createMutation.mutateAsync(data)
    } else {
      await updateMutation.mutateAsync(data)
    }
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tienda?')) {
      setIsDeleting(true)
      try {
        await deleteMutation.mutateAsync()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (!isNew && loadingStore) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Nueva Tienda' : 'Editar Tienda'}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Crea una nueva tienda' : 'Edita los detalles de la tienda'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && hasPermission(PERMISSIONS.STORE_DELETE) && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSubmitting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <Link to="/stores">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          {(isNew ? hasPermission(PERMISSIONS.STORE_CREATE) : hasPermission(PERMISSIONS.STORE_EDIT)) && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? 'Crear Tienda' : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)] pb-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la tienda *</Label>
              <Input id="name" {...register('name')} placeholder="Tienda Principal" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" {...register('code')} placeholder="T001" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="tienda@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} placeholder="+53 5 1234567" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register('address')} placeholder="Calle 123" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register('city')} placeholder="La Habana" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Provincia</Label>
                <Input id="state" {...register('state')} placeholder="La Habana" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" {...register('country')} placeholder="Cuba" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input id="postal_code" {...register('postal_code')} placeholder="10400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de local</Label>
              <Select
                value={watch('store_type') || 'store'}
                onValueChange={(v) => setValue('store_type', v as 'store' | 'warehouse')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Tienda / Punto de venta</SelectItem>
                  <SelectItem value="warehouse">Almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={watch('currency_id') || ''} onValueChange={(v) => setValue('currency_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Prefijo Facturas</Label>
                <Input id="invoice_prefix" {...register('invoice_prefix')} placeholder="FACT" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pre_invoice_prefix">Prefijo Prefacturas</Label>
                <Input id="pre_invoice_prefix" {...register('pre_invoice_prefix')} placeholder="PRE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer_prefix">Prefijo Ofertas</Label>
                <Input id="offer_prefix" {...register('offer_prefix')} placeholder="OFERTA" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="cursor-pointer">Tienda activa</Label>
                <p className="text-xs text-muted-foreground">Las tiendas inactivas no aparecen en la selección</p>
              </div>
              <Switch
                id="is_active"
                checked={watch('is_active') ?? true}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </form>
  )
}
