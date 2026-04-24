import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Store, CreateStoreInput } from '@/api/stores'
import { useCurrencies } from '@/hooks/useSettings'

interface StoreFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store?: Store
  onSubmit: (data: CreateStoreInput) => void
  isLoading?: boolean
}

export function StoreForm({ open, onOpenChange, store, onSubmit, isLoading }: StoreFormProps) {
  const isEditing = !!store
  const { data: currencies } = useCurrencies()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateStoreInput>({
    defaultValues: {
      name: '',
      code: '',
      store_type: 'store',
      address: '',
      city: '',
      state: '',
      country: 'Cuba',
      postal_code: '',
      phone: '',
      email: '',
      currency_id: 'CUP',
      invoice_prefix: '',
      offer_prefix: '',
    },
  })

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        code: store.code,
        store_type: store.store_type || 'store',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        country: store.country || 'Cuba',
        postal_code: store.postal_code || '',
        phone: store.phone || '',
        email: store.email || '',
        currency_id: store.currency_id || 'CUP',
        invoice_prefix: store.invoice_prefix || '',
        offer_prefix: store.offer_prefix || '',
      })
    } else {
      reset({
        name: '',
        code: '',
        store_type: 'store',
        address: '',
        city: '',
        state: '',
        country: 'Cuba',
        postal_code: '',
        phone: '',
        email: '',
        currency_id: 'CUP',
        invoice_prefix: '',
        offer_prefix: '',
      })
    }
  }, [store, reset])

  const onFormSubmit = (data: CreateStoreInput) => {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name', { required: 'El nombre es requerido' })}
                placeholder="Nombre de la tienda"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...register('code', { required: 'El código es requerido' })}
                placeholder="Código único"
              />
              {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
            </div>

            <div className="col-span-2">
              <Label>Tipo</Label>
              <Controller
                name="store_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'store'} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store">Tienda / Punto de venta</SelectItem>
                      <SelectItem value="warehouse">Almacén</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register('address')} placeholder="Dirección completa" />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...register('city')} placeholder="Ciudad" />
            </div>

            <div>
              <Label htmlFor="state">Provincia</Label>
              <Input id="state" {...register('state')} placeholder="Provincia" />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} placeholder="+53 555 1234" />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="tienda@ejemplo.com" />
            </div>

            <div>
              <Label htmlFor="currency_id">Moneda</Label>
              <Controller
                name="currency_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((c) => (
                        <SelectItem key={c.id} value={c.code}>
                          {c.code} – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="invoice_prefix">Prefijo Facturas</Label>
              <Input id="invoice_prefix" {...register('invoice_prefix')} placeholder="FACT" />
            </div>

            <div>
              <Label htmlFor="offer_prefix">Prefijo Ofertas</Label>
              <Input id="offer_prefix" {...register('offer_prefix')} placeholder="OFERTA" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
