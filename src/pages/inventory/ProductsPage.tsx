import { useState } from 'react'
import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useCategories } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductCard } from '@/components/products/ProductCard'
import type { Product } from '@/api/products'
import { showErrorToast } from '@/lib/errorToast'
import { Plus, Search, Upload, Package } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductCsvImport } from '@/components/products/ProductCsvImport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { CreateProductInput } from '@/api/products'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { data, isLoading } = useProducts({ search: search || undefined, categoryId, page, pageSize: 20 })
  const { data: categories } = useCategories()
  const deleteProduct = useDeleteProduct()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const products = data?.products || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const handleCreate = async (input: CreateProductInput) => {
    try {
      await createProduct.mutateAsync(input)
      setFormOpen(false)
      toast({ title: 'Producto creado', description: 'El producto se ha creado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo crear el producto.')
    }
  }

  const handleUpdate = async (input: CreateProductInput) => {
    if (!editingProduct) return
    try {
      await updateProduct.mutateAsync({ id: editingProduct.id, input })
      setFormOpen(false)
      setEditingProduct(null)
      toast({ title: 'Producto actualizado', description: 'El producto se ha actualizado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo actualizar el producto.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: 'Producto eliminado', description: 'El producto se ha eliminado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo eliminar el producto.')
    }
  }

  const handleOpenForm = (product: Product | null) => {
    setEditingProduct(product || null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu inventario de productos</p>
        </div>
        {hasPermission(PERMISSIONS.PRODUCT_CREATE) && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCsvOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button onClick={() => handleOpenForm(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={categoryId ?? 'all'}
          onValueChange={(v) => { setCategoryId(v === 'all' ? undefined : v); setPage(1); }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {(categories ?? []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Productos ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={(p) => handleOpenForm(p)}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct ?? undefined}
        onSubmit={editingProduct ? handleUpdate : handleCreate}
        isLoading={false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será marcado como inactivo.
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

      <ProductCsvImport open={csvOpen} onClose={() => setCsvOpen(false)} />
    </div>
  )
}
