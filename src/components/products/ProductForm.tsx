import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Product, CreateProductInput } from '@/api/products'
import { useCategories } from '@/hooks/useProducts'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

interface StockEntry {
  store_id: string
  quantity: number
}

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
  const defaultCurrencyId = useDefaultCurrency()
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([])

  const { data: stores } = useQuery({
    queryKey: ['stores-for-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('stores').select('id, name').eq('is_active', true)
      return data || []
    },
    enabled: open && !isEditing,
  })

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data } = await supabase.from('currencies').select('*').eq('is_active', true).order('code')
      return data || []
    },
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      price_currency_id: defaultCurrencyId,
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
        price_currency_id: product.price_currency_id || defaultCurrencyId,
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
        price_currency_id: defaultCurrencyId,
        cost: 0,
        tax_rate: 0,
        description: '',
        barcode: '',
        has_variants: false,
      })
      setStockEntries([])
    }
  }, [product, reset, defaultCurrencyId])

  const addStockEntry = () => {
    setStockEntries([...stockEntries, { store_id: '', quantity: 0 }])
  }

  const updateStockEntry = (index: number, field: keyof StockEntry, value: string | number) => {
    const updated = [...stockEntries]
    updated[index] = { ...updated[index], [field]: value }
    setStockEntries(updated)
  }

  const removeStockEntry = (index: number) => {
    setStockEntries(stockEntries.filter((_, i) => i !== index))
  }

  const onFormSubmit = (data: CreateProductInput) => {
    const validEntries = stockEntries.filter(e => e.store_id && e.quantity > 0)
    onSubmit({ ...data, initial_stock: validEntries.length > 0 ? validEntries : undefined })
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
              <Label htmlFor="price_currency_id">Moneda</Label>
              <Select
                value={watch('price_currency_id') || defaultCurrencyId}
                onValueChange={(value) => setValue('price_currency_id', value)}
              >
                <SelectTrigger id="price_currency_id">
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {(currencies ?? []).map((cur) => (
                    <SelectItem key={cur.id} value={cur.id}>{cur.code}{cur.symbol ? ` (${cur.symbol})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {!isEditing && (
              <>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Stock Inicial (opcional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addStockEntry}>
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar tienda
                    </Button>
                  </div>
                  {stockEntries.map((entry, index) => (
                    <div key={index} className="flex gap-2 items-start mb-2">
                      <Select
                        value={entry.store_id}
                        onValueChange={(v) => updateStockEntry(index, 'store_id', v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Tienda" />
                        </SelectTrigger>
                        <SelectContent>
                          {(stores ?? []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="Cant"
                        value={entry.quantity || ''}
                        onChange={(e) => updateStockEntry(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStockEntry(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
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
