import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Truck, MapPin, Phone, Mail, Building2, Globe, Trash2, Edit } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { getSupplier, updateSupplier, deleteSupplier, createSupplier } from '@/api/suppliers'
import { useStores } from '@/hooks/useStores'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.number().optional(),
  credit_limit: z.number().optional(),
  is_global: z.boolean().optional(),
  store_ids: z.array(z.string()).optional(),
})

type SupplierFormData = z.infer<typeof supplierSchema>

export function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const isNew = !id || id === 'new'

  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const { hasPermission } = usePermissions()

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id!),
    enabled: !isNew && !!id,
  })

  const { data: storesData } = useStores()
  const stores = storesData || []

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData) => updateSupplier(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({ title: 'Proveedor actualizado', description: 'El proveedor se ha actualizado correctamente' })
      setFormOpen(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) => createSupplier(organizationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({ title: 'Proveedor creado', description: 'El proveedor se ha creado correctamente' })
      navigate('/suppliers')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplier(id!),
    onSuccess: () => {
      toast({ title: 'Proveedor eliminado', description: 'El proveedor se ha eliminado correctamente' })
      navigate('/suppliers')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      is_global: false,
      store_ids: [],
    },
  })

  const watchIsGlobal = watch('is_global')
  const watchStoreIds = watch('store_ids') || []

  useEffect(() => {
    if (supplier) {
      const supplierStoreIds = supplier.stores?.map((s: any) => s.id) || []
      reset({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        country: supplier.country || '',
        postal_code: supplier.postal_code || '',
        tax_id: supplier.tax_id || '',
        payment_terms: supplier.payment_terms,
        credit_limit: supplier.credit_limit,
        is_global: supplier.is_global || false,
        store_ids: supplierStoreIds,
      })
    }
  }, [supplier, reset])

  const handleUpdate = async (data: SupplierFormData) => {
    await updateMutation.mutateAsync(data)
  }

  const handleCreate = async (data: SupplierFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isNew) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuevo Proveedor</h1>
            <p className="text-muted-foreground">Completa los datos del proveedor</p>
          </div>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">NIT/Tax ID</Label>
                  <Input id="tax_id" {...register('tax_id')} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" {...register('address')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input id="country" {...register('country')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Límite de Crédito</Label>
                  <Input id="credit_limit" type="number" {...register('credit_limit', { valueAsNumber: true })} />
                </div>
                <div className="col-span-2 border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="is_global" {...register('is_global')} className="h-4 w-4" />
                    <Label htmlFor="is_global" className="font-medium">
                      <Globe className="inline h-4 w-4 mr-1" />
                      Proveedor Global
                    </Label>
                  </div>
                  {!watchIsGlobal && stores.length > 0 && (
                    <div className="space-y-2">
                      {stores.map((store) => (
                        <div key={store.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`store-${store.id}`}
                            checked={watchStoreIds.includes(store.id)}
                            onChange={(e) => {
                              const current = watchStoreIds || []
                              if (e.target.checked) {
                                setValue('store_ids', [...current, store.id])
                              } else {
                                setValue('store_ids', current.filter((sid: string) => sid !== store.id))
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`store-${store.id}`} className="font-normal">{store.name}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/suppliers')}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Crear Proveedor
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container py-8">
        <p>Proveedor no encontrado</p>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground">Código: {supplier.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.SUPPLIER_EDIT) && (
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {hasPermission(PERMISSIONS.SUPPLIER_DELETE) && (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                {supplier.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span>{supplier.is_global ? 'Global' : 'Por tienda'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">NIT/Tax ID</span>
              <span>{supplier.tax_id || '-'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite de Crédito</span>
              <span>{supplier.credit_limit ? `$${supplier.credit_limit}` : '-'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Actual</span>
              <span>{supplier.current_balance ? `$${supplier.current_balance}` : '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.email || '-'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.phone || '-'}</span>
            </div>
            <hr className="my-2" />
            <div>
              <p className="text-muted-foreground mb-1">Dirección</p>
              <p>{supplier.address || '-'}</p>
              <p>{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</p>
              <p>{supplier.country} {supplier.postal_code}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!supplier.is_global && supplier.stores && supplier.stores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tiendas que abastece
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supplier.stores.map((store: any) => (
                <Badge key={store.id} variant="outline">
                  {store.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Provincia</Label>
                <Input id="state" {...register('state')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" {...register('country')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input id="postal_code" {...register('postal_code')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">NIT/Tax ID</Label>
                <Input id="tax_id" {...register('tax_id')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Límite de Crédito</Label>
                <Input id="credit_limit" type="number" {...register('credit_limit', { valueAsNumber: true })} />
              </div>
              
              <div className="col-span-2 border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="is_global"
                    {...register('is_global')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_global" className="font-medium">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Proveedor Global
                  </Label>
                </div>
                
                {!watchIsGlobal && stores.length > 0 && (
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <div key={store.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`store-${store.id}`}
                          checked={watchStoreIds.includes(store.id)}
                          onChange={(e) => {
                            const current = watchStoreIds || []
                            if (e.target.checked) {
                              setValue('store_ids', [...current, store.id])
                            } else {
                              setValue('store_ids', current.filter((id: string) => id !== store.id))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`store-${store.id}`} className="font-normal">
                          {store.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}