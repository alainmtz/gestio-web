import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Proveedores</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">
            Gestiona tus proveedores
          </p>
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
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            <Truck className="h-3.5 w-3.5 inline mr-1.5" />Lista de Proveedores
          </p>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 w-full bg-muted rounded-md" />
            ))}
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            <Truck className="h-3.5 w-3.5 inline mr-1.5" />Lista de Proveedores
          </p>
          <div className="text-center py-12 text-muted-foreground">
            No hay proveedores. Crea el primero.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            <Truck className="h-3.5 w-3.5 inline mr-1.5" />Lista de Proveedores ({suppliers.length})
          </p>
          <div className="grid gap-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                <Link to={`/suppliers/${supplier.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium">{supplier.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{supplier.code}</span>
                      <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                        {supplier.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {supplier.email && <span>{supplier.email}</span>}
                      {supplier.phone && <span>{supplier.phone}</span>}
                      {supplier.city && <span>{supplier.city}</span>}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-1 shrink-0">
                  {hasPermission(PERMISSIONS.SUPPLIER_EDIT) && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission(PERMISSIONS.SUPPLIER_DELETE) && (
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(supplier.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
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