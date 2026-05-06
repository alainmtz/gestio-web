import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { createNotifications } from '@/api/notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

const LOW_STOCK_THRESHOLD = 5

export function useRealtimeNotifications() {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const userRole = useAuthStore((s) => s.user?.role ?? 'MEMBER')
  const addNotification = useNotificationStore((s) => s.addNotification)
  const channelsRef = useRef<RealtimeChannel[]>([])

  const isAdmin = ['OWNER', 'ADMIN', 'ORG_OWNER', 'ORG_ADMIN'].includes(userRole?.toUpperCase())

  useEffect(() => {
    if (!organizationId || !userId) return

    const inventoryChannel = supabase
      .channel(`org-inventory-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const row = payload.new as { available: number; product_id: string; store_id?: string }
          if (row.available <= LOW_STOCK_THRESHOLD && row.available >= 0) {
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', row.product_id)
              .maybeSingle()

            const { data: store } = row.store_id
              ? await supabase.from('stores').select('name').eq('id', row.store_id).maybeSingle()
              : { data: null }

            const productName = product?.name || 'Producto'
            const storeName = store?.name ? ` (${store.name})` : ''
            const msg = `${productName}${storeName}: solo ${row.available} unidades disponibles.`

            addNotification({ type: 'low_stock', title: 'Stock bajo', message: msg, href: '/inventory/products' })

            if (isAdmin) {
              try {
                await createNotifications([{
                  user_id: userId,
                  organization_id: organizationId,
                  type: 'low_stock',
                  title: 'Stock bajo',
                  message: msg,
                  href: '/inventory/products',
                  metadata: { product_id: row.product_id, product_name: productName, store_id: row.store_id, store_name: store?.name, available: row.available },
                }])
              } catch {}
            }
          }
        }
      )
      .subscribe()

    const invoicesChannel = supabase
      .channel(`org-invoices-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invoices',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; number: string; total: number; customer_id?: string; status?: string }
          const { data: customer } = row.customer_id
            ? await supabase.from('customers').select('name').eq('id', row.customer_id).maybeSingle()
            : { data: null }

          const customerInfo = customer?.name ? ` para ${customer.name}` : ''
          const statusLabel = row.status === 'draft' ? ' (Borrador)' : row.status === 'issued' ? ' (Emitida)' : ''
          const msg = `Factura #${row.number || row.id.slice(0, 8)}${customerInfo} por $${row.total?.toFixed(2) ?? '0.00'}${statusLabel}`

          addNotification({ type: 'new_invoice', title: 'Nueva factura creada', message: msg, href: `/billing/invoices/${row.id}` })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'new_invoice',
                title: 'Nueva factura creada',
                message: msg,
                href: `/billing/invoices/${row.id}`,
                metadata: { invoice_id: row.id, customer_name: customer?.name, total: row.total, status: row.status },
              }])
            } catch {}
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const newRow = payload.new as { id: string; number: string; payment_status: string; customer_id?: string; total?: number }
          const oldRow = payload.old as { payment_status: string }
          if (newRow.payment_status === 'paid' && oldRow.payment_status !== 'paid') {
            const { data: customer } = newRow.customer_id
              ? await supabase.from('customers').select('name').eq('id', newRow.customer_id).maybeSingle()
              : { data: null }

            const customerInfo = customer?.name ? ` de ${customer.name}` : ''
            const total = newRow.total ? `$${newRow.total.toFixed(2)}` : ''
            const msg = `Factura #${newRow.number || newRow.id.slice(0, 8)}${customerInfo} marcada como pagada${total ? ` (${total})` : ''}.`

            addNotification({ type: 'payment', title: 'Pago registrado', message: msg, href: `/billing/invoices/${newRow.id}` })

            if (isAdmin) {
              try {
                await createNotifications([{
                  user_id: userId,
                  organization_id: organizationId,
                  type: 'payment',
                  title: 'Pago registrado',
                  message: msg,
                  href: `/billing/invoices/${newRow.id}`,
                  metadata: { invoice_id: newRow.id, customer_name: customer?.name, total: newRow.total },
                }])
              } catch {}
            }
          }
        }
      )
      .subscribe()

    const consignmentsChannel = supabase
      .channel(`org-consignments-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consignment_stock',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; partner_id: string; total_items?: number }
          const { data: partner } = row.partner_id
            ? await supabase.from('customers').select('name').eq('id', row.partner_id).maybeSingle()
            : { data: null }

          const partnerInfo = partner?.name ? ` con ${partner.name}` : ''
          const itemsInfo = row.total_items ? ` (${row.total_items} productos)` : ''
          const msg = `Nueva consignación${partnerInfo}${itemsInfo}.`

          addNotification({ type: 'consignment', title: 'Nueva consignación', message: msg, href: `/consignments/${row.id}` })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'consignment',
                title: 'Nueva consignación',
                message: msg,
                href: `/consignments/${row.id}`,
                metadata: { consignment_id: row.id, partner_name: partner?.name, total_items: row.total_items },
              }])
            } catch {}
          }
        }
      )
      .subscribe()

    const offersChannel = supabase
      .channel(`org-offers-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; number?: string; customer_id?: string; total?: number; status?: string }
          const { data: customer } = row.customer_id
            ? await supabase.from('customers').select('name').eq('id', row.customer_id).maybeSingle()
            : { data: null }

          const customerInfo = customer?.name ? ` para ${customer.name}` : ''
          const totalInfo = row.total ? ` por $${row.total.toFixed(2)}` : ''
          const statusLabel = row.status === 'draft' ? ' (Borrador)' : row.status === 'sent' ? ' (Enviada)' : ''
          const msg = `Oferta #${row.number || row.id.slice(0, 8)}${customerInfo}${totalInfo}${statusLabel}.`

          addNotification({ type: 'new_order', title: 'Nueva oferta', message: msg, href: `/billing/offers/${row.id}` })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'new_order',
                title: 'Nueva oferta',
                message: msg,
                href: `/billing/offers/${row.id}`,
                metadata: { offer_id: row.id, customer_name: customer?.name, total: row.total, status: row.status },
              }])
            } catch {}
          }
        }
      )
      .subscribe()

    const exchangeRatesChannel = supabase
      .channel(`org-exchange-rates-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_rates',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const row = payload.new as { id?: string; base_currency_id: string; target_currency_id: string; rate: number; source?: string; date?: string; created_at?: string } | null
          const oldRow = payload.old as { base_currency_id: string; target_currency_id: string; rate: number; source?: string; date?: string; created_at?: string } | null
          const eventType = payload.eventType

          const { data: currencies } = await supabase
            .from('currencies')
            .select('id, code')
            .in('id', [row?.base_currency_id, row?.target_currency_id, oldRow?.base_currency_id, oldRow?.target_currency_id].filter(Boolean) as string[])

          const codeMap = new Map<string, string>()
          currencies?.forEach((c: { id: string; code: string }) => codeMap.set(c.id, c.code))

          const baseCode = codeMap.get(row?.base_currency_id ?? oldRow?.base_currency_id ?? '') ?? ''
          const targetCode = codeMap.get(row?.target_currency_id ?? oldRow?.target_currency_id ?? '') ?? ''

          let title: string
          let message: string
          let metadata: Record<string, unknown> = {}

          if (eventType === 'INSERT') {
            title = 'Nueva tasa de cambio'
            message = `Tasa ${baseCode} → ${targetCode} = ${(row?.rate ?? 0).toFixed(4)}`
            metadata = {
              event: 'INSERT',
              base_currency_code: baseCode,
              target_currency_code: targetCode,
              base_currency_id: row?.base_currency_id,
              target_currency_id: row?.target_currency_id,
              new_rate: row?.rate,
              new_rate_date: row?.date,
              new_rate_created_at: row?.created_at,
              source: row?.source,
            }
          } else if (eventType === 'UPDATE') {
            title = 'Tasa de cambio actualizada'
            message = `${baseCode} → ${targetCode}: ${oldRow?.rate?.toFixed(4) ?? '?'} → ${(row?.rate ?? 0).toFixed(4)}`
            metadata = {
              event: 'UPDATE',
              base_currency_code: baseCode,
              target_currency_code: targetCode,
              base_currency_id: row?.base_currency_id ?? oldRow?.base_currency_id,
              target_currency_id: row?.target_currency_id ?? oldRow?.target_currency_id,
              old_rate: oldRow?.rate,
              old_rate_date: oldRow?.date,
              old_rate_created_at: oldRow?.created_at,
              new_rate: row?.rate,
              new_rate_date: row?.date,
              new_rate_created_at: row?.created_at,
              source: row?.source ?? oldRow?.source,
            }
          } else {
            title = 'Tasa de cambio eliminada'
            message = `Una tasa de cambio ha sido eliminada.`
            metadata = {
              event: 'DELETE',
              base_currency_code: baseCode,
              target_currency_code: targetCode,
              base_currency_id: oldRow?.base_currency_id,
              target_currency_id: oldRow?.target_currency_id,
              old_rate: oldRow?.rate,
              old_rate_date: oldRow?.date,
              old_rate_created_at: oldRow?.created_at,
              source: oldRow?.source,
            }
          }

          addNotification({ type: 'exchange_rate_change', title, message, href: '/settings/exchange' })

          try {
            await createNotifications([{
              user_id: userId,
              organization_id: organizationId,
              type: 'exchange_rate_change',
              title,
              message,
              href: '/settings/exchange',
              metadata,
            }])
          } catch {}
        }
      )
      .subscribe()

    channelsRef.current = [inventoryChannel, invoicesChannel, consignmentsChannel, offersChannel, exchangeRatesChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [organizationId, userId, isAdmin, addNotification])
}
