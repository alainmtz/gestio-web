import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Trash2, Plus, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { productSchema, type ProductFormData } from '@/schemas'
import { getProduct, createProduct, updateProduct, deleteProduct, getCategories, type Product } from '@/api/products'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'

interface InventoryData {
  product_id: string
  store_id: string
  quantity: number
  reserved_quantity: number
  min_quantity: number
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  const userId = useAuthStore((state) => state.user?.id)
  const currentStoreId = useAuthStore((state) => state.currentStore?.id)
  const { hasPermission } = usePermissions()
  const defaultCurrencyId = useDefaultCurrency()

  const isNew = !id || id === 'new'
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => getCategories(organizationId!),
    enabled: !!organizationId,
  })

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !isNew && !!id,
  })

  const { data: inventoryData } = useQuery({
    queryKey: ['productInventory', id],
    queryFn: async () => {
      if (!id) return []
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', id)
      return data as InventoryData[]
    },
    enabled: !isNew && !!id,
  })

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data } = await supabase.from('currencies').select('*').eq('is_active', true).order('code')
      return data || []
    },
  })

  const { data: stores } = useQuery({
    queryKey: ['stores', organizationId],
    queryFn: async () => {
      const { data } = await supabase.from('stores').select('*').eq('organization_id', organizationId).eq('is_active', true)
      return data || []
    },
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProduct(organizationId!, userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Producto creado', description: 'El producto se ha creado correctamente', variant: 'default' })
      navigate('/inventory/products')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => updateProduct(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Producto actualizado', description: 'Los cambios se han guardado correctamente', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Producto eliminado', description: 'El producto se ha eliminado correctamente', variant: 'default' })
      navigate('/inventory/products')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      price: 0,
      price_currency_id: defaultCurrencyId,
      cost: 0,
      tax_rate: 0,
      barcode: '',
      has_variants: false,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category_id: product.category_id || '',
        price: product.price,
        price_currency_id: product.price_currency_id || defaultCurrencyId,
        cost: product.cost || 0,
        tax_rate: product.tax_rate || 0,
        barcode: product.barcode || '',
        has_variants: product.has_variants,
      })
    }
  }, [product, reset, defaultCurrencyId])

  const onSubmit = async (data: ProductFormData) => {
    if (isNew) {
      await createMutation.mutateAsync(data)
    } else {
      await updateMutation.mutateAsync(data)
    }
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setIsDeleting(true)
      try {
        await deleteMutation.mutateAsync()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (!isNew && loadingProduct) {
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
          <Link to="/inventory/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {isNew ? 'Nuevo Producto' : 'Editar Producto'}
              </h1>
              {!isNew && product?.is_consignment && (
                <Badge variant="outline" className="text-xs gap-1 h-6">
                  <ClipboardList className="h-3 w-3" />
                  Consignación
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isNew ? 'Crea un nuevo producto en tu inventario' : 'Edita los detalles del producto'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && hasPermission(PERMISSIONS.PRODUCT_DELETE) && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSubmitting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <Link to="/inventory/products">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          {(isNew ? hasPermission(PERMISSIONS.PRODUCT_CREATE) : hasPermission(PERMISSIONS.PRODUCT_EDIT)) && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? 'Crear Producto' : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto *</Label>
              <Input id="name" {...register('name')} placeholder="Ej: Camisa Manga Larga" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" {...register('sku')} placeholder="CAM-001" />
                {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de barras</Label>
                <Input id="barcode" {...register('barcode')} placeholder="123456789" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoría</Label>
              <Select value={watch('category_id') || ''} onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" {...register('description')} placeholder="Descripción del producto" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios y Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Precio de venta *</Label>
                <Input id="price" type="number" step="0.01" {...register('price')} placeholder="0.00" />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_currency_id">Moneda</Label>
                <Select value={watch('price_currency_id') || defaultCurrencyId} onValueChange={(v) => setValue('price_currency_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies?.map((cur) => (
                      <SelectItem key={cur.id} value={cur.id}>{cur.code}{cur.symbol ? ` (${cur.symbol})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input id="cost" type="number" step="0.01" {...register('cost')} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tasa de impuesto (%)</Label>
              <Input id="tax_rate" type="number" step="0.01" {...register('tax_rate')} placeholder="0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stock por Tienda</CardTitle>
              <Link to={`/inventory/movements?productId=${id}&action=opening`}>
                <Button type="button" size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Stock
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {inventoryData && inventoryData.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Tienda</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Disponible</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Reservado</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Mínimo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventoryData.map((inv) => {
                      const store = stores?.find(s => s.id === inv.store_id)
                      return (
                        <tr key={inv.store_id}>
                          <td className="px-4 py-2">{store?.name || inv.store_id}</td>
                          <td className="px-4 py-2 text-right">{inv.quantity}</td>
                          <td className="px-4 py-2 text-right">{inv.reserved_quantity}</td>
                          <td className="px-4 py-2 text-right">{inv.min_quantity}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Sin stock registrado. Usa el botón "Agregar Stock" para añadir inventario inicial.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  )
}