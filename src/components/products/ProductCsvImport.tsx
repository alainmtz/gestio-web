import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'

interface CsvRow {
  sku: string
  name: string
  description?: string
  category_name?: string
  cost?: string
  price: string
  price_currency_code?: string
  tax_rate?: string
  barcode?: string
}

interface ParsedRow extends CsvRow {
  _line: number
  _errors: string[]
  _valid: boolean
  _category_id?: string
  _price_currency_id?: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const CSV_HEADERS = 'sku,name,description,category_name,cost,price,price_currency_code,tax_rate,barcode'

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string): CsvRow[] {
  // Skip comment lines starting with #
  const allLines = text.split(/\r?\n/)
  const cleanedLines = allLines.filter((l) => !l.trimStart().startsWith('#'))
  const cleaned = cleanedLines.join('\n')

  // RFC 4180-compliant CSV parser that handles quoted fields with newlines/commas
  const records: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < cleaned.length) {
    const ch = cleaned[i]
    if (inQuotes) {
      if (ch === '"' && cleaned[i + 1] === '"') {
        field += '"'; i += 2; continue
      } else if (ch === '"') {
        inQuotes = false; i++; continue
      } else {
        field += ch; i++; continue
      }
    }
    if (ch === '"') {
      inQuotes = true; i++; continue
    }
    if (ch === ',') {
      current.push(field.trim()); field = ''; i++; continue
    }
    if (ch === '\n' || (ch === '\r' && cleaned[i + 1] === '\n')) {
      if (ch === '\r') i++
      current.push(field.trim()); field = ''
      if (current.some((f) => f !== '') || current.length > 1) records.push(current)
      current = []; i++; continue
    }
    field += ch; i++
  }
  // Last field/record
  current.push(field.trim())
  if (current.some((f) => f !== '') || current.length > 1) records.push(current)

  if (records.length < 2) {
    return []
  }

  const headers = records[0].map((h) => h.toLowerCase())

  const rows = records.slice(1).map((vals) => {
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim() })
    return row as unknown as CsvRow
  })

  return rows
}

export function ProductCsvImport({ open, onClose }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [done, setDone] = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const currentStore = useAuthStore((s) => s.currentStore)
  const defaultCurrencyId = useDefaultCurrency()

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true)
    try {
      const { data: cats } = await supabase
        .from('product_categories')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')

      const catNames = cats?.map((c) => c.name) ?? []

      let defaultCurrencyCode = 'CUP'
      if (currentStore?.currencyId) {
        const { data: cur } = await supabase.from('currencies').select('code').eq('id', currentStore.currencyId).single()
        if (cur?.code) defaultCurrencyCode = cur.code
      }

      const lines: string[] = []
      lines.push('# PLANTILLA DE IMPORTACIÓN DE PRODUCTOS - Gestio')
      lines.push('# Instrucciones:')
      lines.push('#   - sku y name son OBLIGATORIOS')
      lines.push('#   - price es OBLIGATORIO (número mayor a 0)')
      lines.push('#   - cost y tax_rate son opcionales (default 0)')
      lines.push('#   - category_name debe coincidir EXACTAMENTE con una categoría existente')
      lines.push(`#   - price_currency_code: código de moneda (CUP, USD, EUR, etc). Default: ${defaultCurrencyCode}`)
      lines.push('#   - barcode es opcional')
      lines.push('#')
      if (catNames.length > 0) {
        lines.push(`# Categorías disponibles: ${catNames.join(' | ')}`)
      } else {
        lines.push('# No hay categorías creadas aún. Crea categorías primero o deja category_name vacío.')
      }
      lines.push('#')
      lines.push(CSV_HEADERS)

      const cat1 = catNames[0] ?? ''
      const cat2 = catNames[1] ?? catNames[0] ?? ''
      lines.push(`PROD-001,Producto de ejemplo,Descripción opcional,${cat1},10.00,25.00,${defaultCurrencyCode},0,7890123456789`)
      lines.push(`PROD-002,Otro producto,,${cat2},5.50,15.00,USD,10,`)

      triggerDownload(lines.join('\n'), 'plantilla_productos.csv')
      toast({ title: 'Plantilla descargada', description: catNames.length > 0 ? `Incluye ${catNames.length} categorías disponibles.` : 'No hay categorías — el campo category_name puede ir vacío.' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar la plantilla.', variant: 'destructive' })
    } finally {
      setDownloadingTemplate(false)
    }
  }, [organizationId, currentStore, toast])

  async function handleFile(file: File) {
    const text = await file.text()
    const raw = parseCsv(text)

    // Fetch existing categories
    const { data: cats } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('organization_id', organizationId)
    const catMap: Record<string, string> = {}
    cats?.forEach((c) => { catMap[c.name.toLowerCase()] = c.id })

    // Fetch currencies for price_currency_code resolution
    const { data: currencies } = await supabase
      .from('currencies')
      .select('id, code')
    const currencyMap: Record<string, string> = {}
    currencies?.forEach((c) => { currencyMap[c.code.toUpperCase()] = c.id })

    // Fetch existing SKUs for this org to detect duplicates
    const csvSkus = raw.map((r) => r.sku?.trim()).filter(Boolean)
    const { data: existingProducts } = await supabase
      .from('products')
      .select('sku')
      .eq('organization_id', organizationId)
      .in('sku', csvSkus)
    const existingSkus = new Set((existingProducts ?? []).map((p) => p.sku.toLowerCase()))

    // Auto-create missing categories found in CSV
    const missingCatNames = [...new Set(
      raw
        .map((r) => r.category_name?.trim())
        .filter((n): n is string => !!n && !catMap[n.toLowerCase()])
    )]
    for (const catName of missingCatNames) {
      const { data: newCat } = await supabase
        .from('product_categories')
        .insert({ organization_id: organizationId, name: catName, is_active: true })
        .select('id, name')
        .single()
      if (newCat) catMap[newCat.name.toLowerCase()] = newCat.id
    }
    if (missingCatNames.length > 0) {
      toast({ title: `${missingCatNames.length} categoría(s) creadas`, description: missingCatNames.join(', ') })
    }

    const parsed: ParsedRow[] = raw.map((r, i) => {
      const errors: string[] = []
      if (!r.sku?.trim()) errors.push('SKU requerido')
      else if (existingSkus.has(r.sku.trim().toLowerCase())) errors.push(`SKU "${r.sku.trim()}" ya existe en la base de datos`)
      if (!r.name?.trim()) errors.push('Nombre requerido')
      const price = parseFloat(r.price)
      if (isNaN(price) || price < 0) errors.push('Precio inválido')
      const cost = r.cost ? parseFloat(r.cost) : 0
      if (r.cost && isNaN(cost)) errors.push('Costo inválido')
      const taxRate = r.tax_rate ? parseFloat(r.tax_rate) : 0
      if (r.tax_rate && isNaN(taxRate)) errors.push('Tasa impuesto inválida')

      let categoryId: string | undefined
      if (r.category_name?.trim()) {
        categoryId = catMap[r.category_name.trim().toLowerCase()]
        if (!categoryId) errors.push(`Categoría "${r.category_name}" no encontrada`)
      }

      let priceCurrencyId: string | undefined
      if (r.price_currency_code?.trim()) {
        priceCurrencyId = currencyMap[r.price_currency_code.trim().toUpperCase()]
        if (!priceCurrencyId) errors.push(`Moneda "${r.price_currency_code}" no encontrada`)
      }

      return {
        ...r,
        _line: i + 2,
        _errors: errors,
        _valid: errors.length === 0,
        _category_id: categoryId,
        _price_currency_id: priceCurrencyId,
      }
    })

    setRows(parsed)
    setDone(false)
    setImported(0)
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r._valid)
    if (!validRows.length || !organizationId) return
    setImporting(true)

    let ok = 0
    for (const row of validRows) {
      const { error } = await supabase.from('products').insert({
        organization_id: organizationId,
        store_id: currentStore?.id ?? null,
        sku: row.sku.trim(),
        name: row.name.trim(),
        description: row.description?.trim() || null,
        category_id: row._category_id ?? null,
        cost: parseFloat(row.cost ?? '0') || 0,
        price: parseFloat(row.price),
        price_currency_id: row._price_currency_id ?? defaultCurrencyId,
        tax_rate: parseFloat(row.tax_rate ?? '0') || 0,
        barcode: row.barcode?.trim() || null,
        is_active: true,
        has_variants: false,
      })
      if (!error) ok++
    }

    setImporting(false)
    setImported(ok)
    setDone(true)
    queryClient.invalidateQueries({ queryKey: ['products'] })
    toast({
      title: 'Importación completada',
      description: `${ok} de ${validRows.length} productos importados.`,
    })
  }

  function handleClose() {
    setRows([])
    setDone(false)
    setImported(0)
    onClose()
  }

  const validCount = rows.filter((r) => r._valid).length
  const errorCount = rows.filter((r) => !r._valid).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Productos desde CSV</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload area */}
          {!rows.length && !done && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Arrastra un archivo CSV o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Columnas: sku, name, description, category_name, cost, price, price_currency_code, tax_rate, barcode
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
                {downloadingTemplate
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />
                }
                Descargar plantilla CSV
              </Button>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !done && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {validCount} válidos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    {errorCount} con errores
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setRows([])}>
                  Cambiar archivo
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Línea</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Categoría</th>
                      <th className="px-3 py-2 text-right">Costo</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-left">Moneda</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row) => (
                      <tr key={row._line} className={row._valid ? '' : 'bg-destructive/5'}>
                        <td className="px-3 py-2 text-muted-foreground">{row._line}</td>
                        <td className="px-3 py-2 font-mono">{row.sku}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.category_name || '—'}</td>
                        <td className="px-3 py-2 text-right">{row.cost || '0'}</td>
                        <td className="px-3 py-2 text-right">{row.price}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.price_currency_code || 'CUP'}</td>
                        <td className="px-3 py-2">
                          {row._valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <AlertCircle className="h-3 w-3" />
                              {row._errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Done state */}
          {done && (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-lg font-semibold">{imported} productos importados correctamente</p>
              {errorCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {errorCount} filas tenían errores y fueron omitidas.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {done ? 'Cerrar' : 'Cancelar'}
          </Button>
          {rows.length > 0 && !done && (
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {validCount} productos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
