import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersRound, Search, Eye, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface ConsignmentPartner {
  id: string
  name: string
  code?: string
  type: 'CUSTOMER' | 'SUPPLIER'
  activeConsignments: number
  totalValue: number
  email?: string
  phone?: string
}

export function ConsignmentPartnersPage() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('customers')

  const { data: customerPartners, isLoading: custLoading } = useQuery({
    queryKey: ['consignment-partners', organizationId, 'CUSTOMER'],
    queryFn: async () => {
      const { data: consignments } = await supabase
        .from('consignment_stock')
        .select('*, customer:customers(name, code, email, phone)')
        .eq('organization_id', organizationId)
        .eq('partner_type', 'CUSTOMER')
        .in('status', ['ACTIVE', 'PARTIAL'])

      if (!consignments) return []

      const partnerMap = new Map<string, ConsignmentPartner>()
      consignments.forEach((c) => {
        const cust = c.customer as { name: string; code?: string; email?: string; phone?: string } | null
        if (!cust || !c.customer_id) return

        const existing = partnerMap.get(c.customer_id)
        if (existing) {
          existing.activeConsignments += 1
        } else {
          partnerMap.set(c.customer_id, {
            id: c.customer_id,
            name: cust.name,
            code: cust.code,
            type: 'CUSTOMER',
            activeConsignments: 1,
            totalValue: 0,
            email: cust.email,
            phone: cust.phone,
          })
        }
      })

      return Array.from(partnerMap.values())
    },
    enabled: !!organizationId,
  })

  const { data: supplierPartners, isLoading: supLoading } = useQuery({
    queryKey: ['consignment-partners', organizationId, 'SUPPLIER'],
    queryFn: async () => {
      const { data: consignments } = await supabase
        .from('consignment_stock')
        .select('*, supplier:suppliers(name, code, email, phone)')
        .eq('organization_id', organizationId)
        .eq('partner_type', 'SUPPLIER')
        .in('status', ['ACTIVE', 'PARTIAL'])

      if (!consignments) return []

      const partnerMap = new Map<string, ConsignmentPartner>()
      consignments.forEach((c) => {
        const sup = c.supplier as { name: string; code?: string; email?: string; phone?: string } | null
        if (!sup || !c.supplier_id) return

        const existing = partnerMap.get(c.supplier_id)
        if (existing) {
          existing.activeConsignments += 1
        } else {
          partnerMap.set(c.supplier_id, {
            id: c.supplier_id,
            name: sup.name,
            code: sup.code,
            type: 'SUPPLIER',
            activeConsignments: 1,
            totalValue: 0,
            email: sup.email,
            phone: sup.phone,
          })
        }
      })

      return Array.from(partnerMap.values())
    },
    enabled: !!organizationId,
  })

  const filteredCustomers = (customerPartners || []).filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredSuppliers = (supplierPartners || []).filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  )

  const renderPartnerList = (partners: ConsignmentPartner[], loading: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      )
    }

    if (partners.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <UsersRound className="mx-auto h-12 w-12 mb-3 text-muted-foreground/50" />
          <p className="font-medium">No hay socios en consignación</p>
          <p className="text-sm mt-1">Crea una consignación para añadir socios</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{partner.name}</h3>
                  {partner.code && (
                    <p className="text-sm text-muted-foreground font-mono">{partner.code}</p>
                  )}
                </div>
                <Badge variant={partner.type === 'CUSTOMER' ? 'default' : 'secondary'}>
                  {partner.type === 'CUSTOMER' ? 'Cliente' : 'Proveedor'}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                {partner.email && <span>{partner.email}</span>}
                {partner.phone && <span>{partner.phone}</span>}
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{partner.activeConsignments} consignación{partner.activeConsignments > 1 ? 'es' : ''} activa{partner.activeConsignments > 1 ? 's' : ''}</span>
                </div>
                <Link to={`/consignments/list`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Ver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Socios de Consignación</h1>
          <p className="text-muted-foreground">Clientes y proveedores con consignaciones activas</p>
        </div>
        <Link to="/consignments/list">
          <Button>
            <UsersRound className="mr-2 h-4 w-4" />
            Ver Consignaciones
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar socio..."
          className="pl-9 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers">Clientes ({customerPartners?.length || 0})</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores ({supplierPartners?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          {renderPartnerList(filteredCustomers, custLoading)}
        </TabsContent>

        <TabsContent value="suppliers">
          {renderPartnerList(filteredSuppliers, supLoading)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
