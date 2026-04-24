import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuppliers, useDeleteSupplier, useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers'
import { useStores } from '@/hooks/useStores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus, Search, Edit, Trash2, Globe } from 'lucide-react'
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
import { useToast } from '@/lib/toast'
import { showErrorToast } from '@/lib/errorToast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  const { data, isLoading } = useSuppliers({ search: search || undefined, pageSize: 50 })
  const { data: storesData } = useStores()
  const deleteSupplier = useDeleteSupplier()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const suppliers = data?.suppliers || []
  const stores = storesData || []

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
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      tax_id: '',
      is_global: false,
      store_ids: [],
    },
  })

  const watchIsGlobal = watch('is_global')
  const watchStoreIds = watch('store_ids') || []

  const handleOpenForm = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier)
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
    } else {
      setEditingSupplier(null)
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        tax_id: '',
        is_global: false,
        store_ids: [],
      })
    }
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingSupplier(null)
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      tax_id: '',
      is_global: false,
      store_ids: [],
    })
  }

  const handleCreate = async (data: SupplierFormData) => {
    try {
      await createSupplier.mutateAsync(data)
      handleCloseForm()
      toast({ title: 'Proveedor creado', description: 'El proveedor se ha creado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo crear el proveedor.')
    }
  }

  const handleUpdate = async (data: SupplierFormData) => {
    try {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, input: data })
      handleCloseForm()
      toast({ title: 'Proveedor actualizado', description: 'El proveedor se ha actualizado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo actualizar el proveedor.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSupplier.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: 'Proveedor eliminado', description: 'El proveedor se ha eliminado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo eliminar el proveedor.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona tus proveedores</p>
        </div>
        {hasPermission(PERMISSIONS.SUPPLIER_CREATE) && (
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedores..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay proveedores. Crea el primero.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplier.code}</p>
                  </div>
                </div>
                <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                {supplier.city && <p><span className="text-muted-foreground">Ciudad:</span> {supplier.city}</p>}
                {supplier.email && <p><span className="text-muted-foreground">Email:</span> {supplier.email}</p>}
                {supplier.phone && <p><span className="text-muted-foreground">Teléfono:</span> {supplier.phone}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                {hasPermission(PERMISSIONS.SUPPLIER_EDIT) && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenForm(supplier) }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {hasPermission(PERMISSIONS.SUPPLIER_DELETE) && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(supplier.id) }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(editingSupplier ? handleUpdate : handleCreate)} className="space-y-4">
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
                <p className="text-sm text-muted-foreground mb-4">
                  {watchIsGlobal 
                    ? 'Este proveedor suministro a todas las tiendas' 
                    : 'Selecciona las tiendas a las que suministro este proveedor'}
                </p>
                
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
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSupplier ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}