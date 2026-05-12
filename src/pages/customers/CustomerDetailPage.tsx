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
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { customerSchema, type CustomerFormData } from '@/schemas'
import { getCustomer, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()

  const isNew = !id || id === 'new'
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('individual')

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id!),
    enabled: !isNew && !!id,
  })

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!organizationId) throw new Error('Organization not found')
      
      const { name, customer_type, tax_id, email, phone, credit_limit, notes, tags } = data
      return createCustomer(organizationId, { 
        name, 
        customer_type, 
        tax_id, 
        email, 
        phone, 
        credit_limit, 
        notes, 
        tags 
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ title: 'Cliente creado', description: 'El cliente se ha creado correctamente', variant: 'default' })
      navigate('/customers/list')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) => updateCustomer(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ title: 'Cliente actualizado', description: 'Los cambios se han guardado correctamente', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ title: 'Cliente eliminado', description: 'El cliente se ha eliminado correctamente', variant: 'default' })
      navigate('/customers/list')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      customer_type: 'individual',
      email: '',
      phone: '',
      credit_limit: 0,
      notes: '',
      tags: [],
    },
  })

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        customer_type: customer.customer_type || 'individual',
        tax_id: customer.tax_id || '',
        email: customer.email || '',
        phone: customer.phone || '',
        credit_limit: customer.credit_limit,
        notes: customer.notes || '',
        tags: customer.tags || [],
      })
      setSelectedType(customer.customer_type || 'individual')
    }
  }, [customer, reset])

  const onSubmit = async (data: CustomerFormData) => {
    if (isNew) {
      await createMutation.mutateAsync(data)
    } else {
      await updateMutation.mutateAsync(data)
    }
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      setIsDeleting(true)
      try {
        await deleteMutation.mutateAsync()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (!isNew && loadingCustomer) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link to="/customers/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
              <h1 className="text-lg font-semibold tracking-tight">
                {isNew ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground monospace">
              {isNew ? 'Crea un nuevo cliente' : 'Edita los detalles del cliente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && hasPermission(PERMISSIONS.CUSTOMER_DELETE) && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSubmitting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <Link to="/customers/list">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          {(isNew ? hasPermission(PERMISSIONS.CUSTOMER_CREATE) : hasPermission(PERMISSIONS.CUSTOMER_EDIT)) && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? 'Crear Cliente' : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            Información Personal
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register('name')} placeholder="Nombre completo" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" value={customer?.code || (isNew ? 'Se generará automáticamente' : '')} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select value={selectedType} onValueChange={(v: 'individual' | 'business') => { setSelectedType(v); setValue('customer_type', v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedType === 'business' && (
              <div className="space-y-2">
                <Label htmlFor="tax_id">Registro Tributario (NIT)</Label>
                <Input id="tax_id" {...register('tax_id')} placeholder="NIT de la empresa" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="email@ejemplo.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register('phone')} placeholder="+53 5 1234567" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            Crédito y Notas
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input id="credit_limit" type="number" {...register('credit_limit')} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Notas adicionales sobre el cliente" />
            </div>
          </div>
        </div>
      </div>

      {!isNew && customer && (
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
            Información Adicional
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Balance Actual</Label>
                <p className="text-2xl font-bold">${(customer.current_balance || 0).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha de Creación</Label>
                <p className="text-lg">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}