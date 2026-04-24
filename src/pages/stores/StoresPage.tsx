import { useState } from 'react'
import { useAllStores, useReactivateStore, useDeleteStore, useCreateStore, useUpdateStore } from '@/hooks/useStores'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, Warehouse, Edit, Trash2, Settings, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StoreForm } from '@/components/stores/StoreForm'
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
import type { CreateStoreInput } from '@/api/stores'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

export function StoresPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingStore, setEditingStore] = useState<any>(null)

  const { data: stores, isLoading } = useAllStores()
  const deleteStore = useDeleteStore()
  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const reactivateStore = useReactivateStore()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const handleCreate = async (input: CreateStoreInput) => {
    try {
      await createStore.mutateAsync(input)
      setFormOpen(false)
      toast({ title: 'Tienda creada', description: 'La tienda se ha creado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo crear la tienda.')
    }
  }

  const handleUpdate = async (input: CreateStoreInput) => {
    try {
      await updateStore.mutateAsync({ id: editingStore.id, input })
      setFormOpen(false)
      setEditingStore(null)
      toast({ title: 'Tienda actualizada', description: 'La tienda se ha actualizado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo actualizar la tienda.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteStore.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: 'Tienda eliminada', description: 'La tienda se ha eliminado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo eliminar la tienda.')
    }
  }

  const handleOpenForm = (store?: any) => {
    setEditingStore(store || null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tiendas</h1>
          <p className="text-muted-foreground">Gestiona tus tiendas y puntos de venta</p>
        </div>
        {hasPermission(PERMISSIONS.STORE_CREATE) && (
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tienda
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores?.map((store) => (
            <Card key={store.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {store.store_type === 'warehouse'
                      ? <Warehouse className="h-5 w-5 text-primary" />
                      : <Store className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-medium">{store.name}</h3>
                    <p className="text-sm text-muted-foreground">{store.code}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={store.is_active ? 'success' : 'secondary'}>
                    {store.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {store.store_type === 'warehouse' ? 'Almacén' : 'Tienda'}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                {store.city && <p><span className="text-muted-foreground">Ciudad:</span> {store.city}</p>}
                {store.currency_id && <p><span className="text-muted-foreground">Moneda:</span> {store.currency_id}</p>}
                {store.email && <p><span className="text-muted-foreground">Email:</span> {store.email}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                {!store.is_active && hasPermission(PERMISSIONS.STORE_EDIT) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600"
                    title="Reactivar tienda"
                    onClick={() => reactivateStore.mutate(store.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                {store.is_active && hasPermission(PERMISSIONS.STORE_EDIT) && (
                  <Button variant="ghost" size="sm" onClick={() => handleOpenForm(store)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Link to={`/stores/${store.id}`}>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission(PERMISSIONS.STORE_DELETE) && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(store.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <StoreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        store={editingStore}
        onSubmit={editingStore ? handleUpdate : handleCreate}
        isLoading={false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tienda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tienda será marcada como inactiva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
