import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCustomers, useDeleteCustomer, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, Hash } from 'lucide-react'
import { CustomerForm } from '@/components/customers/CustomerForm'
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
import type { CreateCustomerInput } from '@/api/customers'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { showErrorToast } from '@/lib/errorToast'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)

  const { data, isLoading } = useCustomers({ search: search || undefined, page, pageSize: 20 })
  const deleteCustomer = useDeleteCustomer()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const customers = data?.customers || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const handleCreate = async (input: CreateCustomerInput) => {
    try {
      await createCustomer.mutateAsync(input)
      setFormOpen(false)
      toast({ title: 'Cliente creado', description: 'El cliente se ha creado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo crear el cliente.')
    }
  }

  const handleUpdate = async (input: CreateCustomerInput) => {
    try {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, input })
      setFormOpen(false)
      setEditingCustomer(null)
      toast({ title: 'Cliente actualizado', description: 'El cliente se ha actualizado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo actualizar el cliente.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCustomer.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: 'Cliente eliminado', description: 'El cliente se ha eliminado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo eliminar el cliente.')
    }
  }

  const handleOpenForm = (customer?: any) => {
    setEditingCustomer(customer || null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Clientes</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">
            Gestiona tus clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(PERMISSIONS.CUSTOMER_CREATE) && (
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <Users className="h-3.5 w-3.5 inline mr-1.5" />Lista de Clientes ({total})
        </p>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-muted rounded-md" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/customers/${customer.id}`} className="font-medium hover:underline">{customer.name}</Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{customer.code}</span>
                          <Badge variant={customer.customer_type === 'business' ? 'default' : 'secondary'} className="text-xs">
                            {customer.customer_type === 'business' ? 'Empresa' : 'Individual'}
                          </Badge>
                          {customer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
                          {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission(PERMISSIONS.CUSTOMER_DELETE) && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(customer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
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

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
        onSubmit={editingCustomer ? handleUpdate : handleCreate}
        isLoading={false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será marcado como inactivo.
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
