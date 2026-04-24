import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

const LOW_STOCK_THRESHOLD = 5

/**
 * Subscribes to Supabase Realtime changes and pushes app notifications.
 * Channels:
 *  - inventory_items  → stock bajo
 *  - invoices         → nueva factura / pago completado
 *  - consignments     → nueva consignación
 *  - offers           → nueva oferta recibida
 *
 * Mount this hook once in DashboardLayout.
 */
export function useRealtimeNotifications() {
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const channelsRef = useRef<RealtimeChannel[]>([])

  useEffect(() => {
    if (!organizationId) return

    // ── 1. Stock bajo ────────────────────────────────────────────────────────
    const inventoryChannel = supabase
      .channel(`org-inventory-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_items',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as { available_quantity: number; product_id: string }
          if (row.available_quantity <= LOW_STOCK_THRESHOLD && row.available_quantity >= 0) {
            addNotification({
              type: 'low_stock',
              title: 'Stock bajo',
              message: `Un producto tiene solo ${row.available_quantity} unidades disponibles.`,
              href: '/inventory/products',
            })
          }
        }
      )
      .subscribe()

    // ── 2. Nuevas facturas ────────────────────────────────────────────────────
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
        (payload) => {
          const row = payload.new as { id: string; number: string; total: number }
          addNotification({
            type: 'new_invoice',
            title: 'Nueva factura creada',
            message: `Factura #${row.number || row.id.slice(0, 8)} por $${row.total ?? 0}`,
            href: `/billing/invoices/${row.id}`,
          })
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
        (payload) => {
          const newRow = payload.new as { id: string; number: string; payment_status: string }
          const oldRow = payload.old as { payment_status: string }
          if (newRow.payment_status === 'paid' && oldRow.payment_status !== 'paid') {
            addNotification({
              type: 'payment',
              title: 'Pago registrado',
              message: `Factura #${newRow.number || newRow.id.slice(0, 8)} marcada como pagada.`,
              href: `/billing/invoices/${newRow.id}`,
            })
          }
        }
      )
      .subscribe()

    // ── 3. Nuevas consignaciones ──────────────────────────────────────────────
    const consignmentsChannel = supabase
      .channel(`org-consignments-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consignments',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; partner_name?: string }
          addNotification({
            type: 'consignment',
            title: 'Nueva consignación',
            message: row.partner_name
              ? `Consignación de ${row.partner_name} registrada.`
              : 'Se registró una nueva consignación.',
            href: `/consignments/${row.id}`,
          })
        }
      )
      .subscribe()

    // ── 4. Nuevas ofertas ─────────────────────────────────────────────────────
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
        (payload) => {
          const row = payload.new as { id: string; number?: string }
          addNotification({
            type: 'new_order',
            title: 'Nueva oferta',
            message: `Oferta #${row.number || row.id.slice(0, 8)} creada.`,
            href: `/billing/offers/${row.id}`,
          })
        }
      )
      .subscribe()

    channelsRef.current = [inventoryChannel, invoicesChannel, consignmentsChannel, offersChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [organizationId, addNotification])
}
