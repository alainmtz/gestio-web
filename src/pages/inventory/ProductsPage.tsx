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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Productos</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">Gestiona tu inventario de productos</p>
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

      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <Package className="h-3.5 w-3.5 inline mr-1.5" />
          Lista de Productos ({total})
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
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
      </div>

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
