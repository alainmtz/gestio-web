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
            addNotification({
              type: 'low_stock',
              title: 'Stock bajo',
                  message: `Un producto tiene solo ${row.available} unidades disponibles.`,
              href: '/inventory/products',
            })

            if (isAdmin) {
              try {
                await createNotifications([{
                  user_id: userId,
                  organization_id: organizationId,
                  type: 'low_stock',
                  title: 'Stock bajo',
              message: `Un producto tiene solo ${row.available} unidades disponibles.`,
                  href: '/inventory/products',
                  metadata: { product_id: row.product_id, store_id: row.store_id },
                }])
              } catch {
                // Notification creation is non-critical for low_stock alerts
              }
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
          const row = payload.new as { id: string; number: string; total: number }
          addNotification({
            type: 'new_invoice',
            title: 'Nueva factura creada',
            message: `Factura #${row.number || row.id.slice(0, 8)} por $${row.total ?? 0}`,
            href: `/billing/invoices/${row.id}`,
          })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'new_invoice',
                title: 'Nueva factura creada',
                message: `Factura #${row.number || row.id.slice(0, 8)} por $${row.total ?? 0}`,
                href: `/billing/invoices/${row.id}`,
                metadata: { invoice_id: row.id },
              }])
            } catch {
              // Notification creation is non-critical for invoice events
            }
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
          const newRow = payload.new as { id: string; number: string; payment_status: string }
          const oldRow = payload.old as { payment_status: string }
          if (newRow.payment_status === 'paid' && oldRow.payment_status !== 'paid') {
            addNotification({
              type: 'payment',
              title: 'Pago registrado',
              message: `Factura #${newRow.number || newRow.id.slice(0, 8)} marcada como pagada.`,
              href: `/billing/invoices/${newRow.id}`,
            })

            if (isAdmin) {
              try {
                await createNotifications([{
                  user_id: userId,
                  organization_id: organizationId,
                  type: 'payment',
                  title: 'Pago registrado',
                  message: `Factura #${newRow.number || newRow.id.slice(0, 8)} marcada como pagada.`,
                  href: `/billing/invoices/${newRow.id}`,
                  metadata: { invoice_id: newRow.id },
                }])
              } catch {
                // Notification creation is non-critical for payment events
              }
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
          const row = payload.new as { id: string; partner_id: string }
          addNotification({
            type: 'consignment',
            title: 'Nueva consignación',
            message: 'Se registró una nueva consignación.',
            href: `/consignments/${row.id}`,
          })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'consignment',
                title: 'Nueva consignación',
                message: 'Se registró una nueva consignación.',
                href: `/consignments/${row.id}`,
                metadata: { consignment_id: row.id },
              }])
            } catch {
              // Notification creation is non-critical for consignment events
            }
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
          const row = payload.new as { id: string; number?: string }
          addNotification({
            type: 'new_order',
            title: 'Nueva oferta',
            message: `Oferta #${row.number || row.id.slice(0, 8)} creada.`,
            href: `/billing/offers/${row.id}`,
          })

          if (isAdmin) {
            try {
              await createNotifications([{
                user_id: userId,
                organization_id: organizationId,
                type: 'new_order',
                title: 'Nueva oferta',
                message: `Oferta #${row.number || row.id.slice(0, 8)} creada.`,
                href: `/billing/offers/${row.id}`,
                metadata: { offer_id: row.id },
              }])
            } catch {
              // Notification creation is non-critical for offer events
            }
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

          let title: string
          let message: string
          let metadata: Record<string, unknown> = {}

          if (eventType === 'INSERT') {
            title = 'Nueva tasa de cambio'
            message = `Tasa ${row?.base_currency_id || ''} → ${row?.target_currency_id || ''} = ${(row?.rate ?? 0).toFixed(4)}`
            metadata = {
              event: 'INSERT',
              base_currency_id: row?.base_currency_id,
              target_currency_id: row?.target_currency_id,
              new_rate: row?.rate,
              new_rate_date: row?.date,
              new_rate_created_at: row?.created_at,
              source: row?.source,
            }
          } else if (eventType === 'UPDATE') {
            title = 'Tasa de cambio actualizada'
            message = `${oldRow?.base_currency_id || ''} → ${oldRow?.target_currency_id || ''}: ${oldRow?.rate?.toFixed(4) ?? '?'} → ${(row?.rate ?? 0).toFixed(4)}`
            metadata = {
              event: 'UPDATE',
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
              base_currency_id: oldRow?.base_currency_id,
              target_currency_id: oldRow?.target_currency_id,
              old_rate: oldRow?.rate,
              old_rate_date: oldRow?.date,
              old_rate_created_at: oldRow?.created_at,
              source: oldRow?.source,
            }
          }

          addNotification({
            type: 'exchange_rate_change',
            title,
            message,
            href: '/settings/exchange',
          })

          if (isAdmin) {
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
            } catch {
              // Notification creation is non-critical for exchange rate events
            }
          }
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
