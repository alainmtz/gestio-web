import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Save, Loader2, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

interface OrganizationSettings {
  organization_id: string
  default_currency?: string
}

interface OrganizationDetails {
  id: string
  name: string
  tax_id?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

export function OrganizationPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const { organizations, setOrganizations } = useAuthStore((state) => ({
    organizations: state.organizations,
    setOrganizations: state.setOrganizations,
  }))
  const organization = useAuthStore((state) => state.currentOrganization)
  const selectOrganization = useAuthStore((state) => state.selectOrganization)
  const organizationId = organization?.id

  const [name, setName] = useState(organization?.name || '')
  const [taxId, setTaxId] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [currency, setCurrency] = useState('CUP')

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['organizationSettings', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_settings')
        .select('organization_id, default_currency')
        .eq('organization_id', organizationId)
        .maybeSingle()
      return data as OrganizationSettings | null
    },
    enabled: !!organizationId,
  })

  const { data: orgDetails, isLoading: orgLoading } = useQuery({
    queryKey: ['organizationDetails', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, tax_id, address, phone, email')
        .eq('id', organizationId)
        .maybeSingle()
      return data as OrganizationDetails | null
    },
    enabled: !!organizationId,
  })

  const isLoading = settingsLoading || orgLoading

  // Sync form state from fetched data
  useEffect(() => {
    if (settings) {
      setCurrency(settings.default_currency || 'CUP')
    }
  }, [settings])

  useEffect(() => {
    if (orgDetails) {
      setName(orgDetails.name || '')
      setTaxId(orgDetails.tax_id || '')
      setAddress(orgDetails.address || '')
      setPhone(orgDetails.phone || '')
      setEmail(orgDetails.email || '')
    }
  }, [orgDetails])

  const { data: stores } = useQuery({
    queryKey: ['stores', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('id, name, code')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Save contact fields + name to organizations
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: name || undefined,
          tax_id: taxId || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
        })
        .eq('id', organizationId)
      if (orgError) throw orgError

      // Save default_currency to organization_settings (upsert)
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .upsert({ organization_id: organizationId, default_currency: currency }, { onConflict: 'organization_id' })
      if (settingsError) throw settingsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationSettings'] })
      queryClient.invalidateQueries({ queryKey: ['organizationDetails'] })
      // Update org name in global auth store so header reflects change immediately
      if (organization && name) {
        const updatedOrg = { ...organization, name }
        selectOrganization(updatedOrg)
        setOrganizations(
          organizations.map((org) => org.id === organization.id ? updatedOrg : org)
        )
      }
      toast({ title: 'Configuración guardada', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code')
      return data || []
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organización</h1>
          <p className="text-muted-foreground">Configura los ajustes de tu organización</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Organización</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de tu organización"
              />
            </div>
            <div className="space-y-2">
              <Label>ID Fiscal (NIT/RIF)</Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej: J-12345678-9"
              />
            </div>
            <div className="space-y-2">
              <Label>Moneda Predeterminada</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies?.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+53 555 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        {hasPermission(PERMISSIONS.SETTINGS_ORG) && (
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        )}
      </div>
    </div>
  )
}