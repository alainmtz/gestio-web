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
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
        {partners.map((partner) => (
          <div key={partner.id} className="rounded-xl border border-border/60 bg-card/80 p-5 hover:shadow-md transition-shadow">
SK|            
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      PX|      <div className="flex flex-wrap items-end justify-between gap-2">
YK|        <div>
ZV|          <div className="flex items-center gap-2">
NM|            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
RJ|            <h1 className="text-lg font-semibold tracking-tight">Socios de Consignación</h1>
JQ|          </div>
PZ|          <p className="mt-0.5 text-xs text-muted-foreground monospace">
TQ|            Clientes y proveedores con consignaciones activas
XZ|          </p>
WT|        </div>

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
