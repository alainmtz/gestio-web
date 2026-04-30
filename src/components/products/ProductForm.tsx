import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Product, CreateProductInput } from '@/api/products'
import { useCategories } from '@/hooks/useProducts'

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  onSubmit: (data: CreateProductInput) => void
  isLoading?: boolean
}

export function ProductForm({ open, onOpenChange, product, onSubmit, isLoading }: ProductFormProps) {
  const { data: categories } = useCategories()
  const isEditing = !!product

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      tax_rate: 0,
      description: '',
      barcode: '',
      category_id: undefined,
      has_variants: false,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost,
        tax_rate: product.tax_rate,
        description: product.description || '',
        barcode: product.barcode || '',
        category_id: product.category_id,
        has_variants: product.has_variants,
      })
    } else {
      reset({
        name: '',
        sku: '',
        price: 0,
        cost: 0,
        tax_rate: 0,
        description: '',
        barcode: '',
        has_variants: false,
      })
    }
  }, [product, reset])

  const onFormSubmit = (data: CreateProductInput) => {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los campos del producto' : 'Completa los datos del nuevo producto'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name', { required: 'El nombre es requerido' })}
                placeholder="Nombre del producto"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku', { required: 'El SKU es requerido' })}
                placeholder="Código SKU"
              />
              {errors.sku && <p className="text-sm text-destructive mt-1">{errors.sku.message}</p>}
            </div>

            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input id="barcode" {...register('barcode')} placeholder="Código de barras" />
            </div>

            <div>
              <Label htmlFor="price">Precio de Venta *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { 
                  required: 'El precio es requerido',
                  valueAsNumber: true 
                })}
                placeholder="0.00"
              />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <Label htmlFor="cost">Precio de Costo</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                {...register('tax_rate', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" {...register('description')} placeholder="Descripción del producto" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="category_id">Categoría</Label>
              <Select
                value={watch('category_id') || 'none'}
                onValueChange={(value) => setValue('category_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
