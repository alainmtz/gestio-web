import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Tags, Edit, Trash2, Loader2 } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory, type ProductCategory } from '@/api/products'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { showErrorToast } from '@/lib/errorToast'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => getCategories(organizationId!),
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createCategory(organizationId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Categoría creada', description: 'La categoría se ha creado correctamente', variant: 'default' })
      setIsDialogOpen(false)
      setCategoryName('')
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error, 'No se pudo crear la categoría')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCategory(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Categoría actualizada', description: 'Los cambios se han guardado correctamente', variant: 'default' })
      setIsDialogOpen(false)
      setEditingCategory(null)
      setCategoryName('')
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error, 'No se pudo actualizar la categoría')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Categoría eliminada', description: 'La categoría se ha eliminado correctamente', variant: 'default' })
      setIsDeleting(null)
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error, 'No se pudo eliminar la categoría')
      setIsDeleting(null)
    },
  })

  const handleOpenDialog = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
    } else {
      setEditingCategory(null)
      setCategoryName('')
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!categoryName.trim()) return
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: categoryName })
    } else {
      createMutation.mutate(categoryName)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      setIsDeleting(id)
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Categorías</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">Organiza tus productos por categorías</p>
        </div>
        {hasPermission(PERMISSIONS.PRODUCT_CREATE) && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <Tags className="h-3.5 w-3.5 inline mr-1.5" />
          Lista de Categorías ({categories?.length || 0})
        </p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border p-4 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{category.name}</h3>
                </div>
                <div className="mt-4 flex gap-2">
                  {hasPermission(PERMISSIONS.PRODUCT_EDIT) && (
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission(PERMISSIONS.PRODUCT_DELETE) && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(category.id)} disabled={isDeleting === category.id}>
                      {isDeleting === category.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay categorías. Crea una para comenzar.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Actualiza el nombre de la categoría para organizar mejor tus productos.'
                : 'Completa el nombre para crear una nueva categoría de productos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la categoría</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej: Camisas"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!categoryName.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}