import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer, CreateCustomerInput } from '@/api/customers'

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSubmit: (data: CreateCustomerInput) => void
  isLoading?: boolean
}

export function CustomerForm({ open, onOpenChange, customer, onSubmit, isLoading }: CustomerFormProps) {
  const isEditing = !!customer

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateCustomerInput>({
    defaultValues: {
      name: '',
      customer_type: 'individual',
      tax_id: '',
      email: '',
      phone: '',
      credit_limit: 0,
      tags: [],
      notes: '',
    },
  })

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        customer_type: customer.customer_type,
        tax_id: customer.tax_id || '',
        email: customer.email || '',
        phone: customer.phone || '',
        credit_limit: customer.credit_limit,
        tags: customer.tags || [],
        notes: customer.notes || '',
      })
    } else {
      reset({
        name: '',
        customer_type: 'individual',
        tax_id: '',
        email: '',
        phone: '',
        credit_limit: 0,
        tags: [],
        notes: '',
      })
    }
  }, [customer, reset])

  const onFormSubmit = (data: CreateCustomerInput) => {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name', { required: 'El nombre es requerido' })}
                placeholder="Nombre completo o razón social"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="customer_type">Tipo *</Label>
              <Select value={watch('customer_type')} onValueChange={(v) => setValue('customer_type', v as 'individual' | 'business')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tax_id">Identificación Fiscal</Label>
              <Input id="tax_id" {...register('tax_id')} placeholder="NIT/NIF/RUC" />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="correo@ejemplo.com" />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} placeholder="+53 555 1234" />
            </div>

            <div>
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                {...register('credit_limit', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register('notes')} placeholder="Notas adicionales" />
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
