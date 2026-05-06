import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/api/products'
import { PERMISSIONS, usePermissions } from '@/hooks/usePermissions'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'
import { supabase } from '@/lib/supabase'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { hasPermission } = usePermissions()
  const hasStock = (product.totalStock ?? 0) > 0
  const defaultCurrencyId = useDefaultCurrency()

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data } = await supabase.from('currencies').select('id, code, symbol').eq('is_active', true)
      return data || []
    },
  })

  const productCurrency = currencies?.find(c => c.id === (product.price_currency_id || defaultCurrencyId))

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/inventory/products/${product.id}`}
              className="font-semibold text-base hover:underline line-clamp-1"
            >
              {product.name}
            </Link>
            {product.barcode && (
              <p className="text-xs text-muted-foreground mt-0.5">{product.barcode}</p>
            )}
            {product.category?.name && (
              <p className="text-sm text-muted-foreground mt-1">{product.category.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasPermission(PERMISSIONS.PRODUCT_EDIT) && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasPermission(PERMISSIONS.PRODUCT_DELETE) && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">SKU</p>
              <p className="text-sm font-mono">{product.sku}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-sm font-medium">${product.price.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">{productCurrency?.code}</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Costo</p>
              <p className="text-sm">${product.cost.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Stock</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Package className={`h-4 w-4 ${hasStock ? 'text-green-600' : 'text-destructive'}`} />
              <span className={`text-lg font-bold ${hasStock ? 'text-green-600' : 'text-destructive'}`}>
                {product.totalStock ?? 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
