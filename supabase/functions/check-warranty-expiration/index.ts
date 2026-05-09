import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

Deno.serve(async (_req: Request) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Fetch invoice items with warranties expiring today
    const { data: expiredItems, error: fetchError } = await supabaseAdmin
      .from('invoice_items')
      .select(`
        id,
        warranty_end_date,
        product_id,
        invoice_id,
        product:products(name, sku),
        invoice:invoices(organization_id)
      `)
      .eq('warranty_end_date', today)
      .not('warranty_end_date', 'is', null)

    if (fetchError) throw fetchError

    if (!expiredItems || expiredItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No warranties expiring today' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Group expired items by organization_id
    const orgMap = new Map<string, typeof expiredItems>()
    for (const item of expiredItems) {
      const orgId = item.invoice?.organization_id as string | undefined
      if (!orgId) continue
      if (!orgMap.has(orgId)) orgMap.set(orgId, [])
      orgMap.get(orgId)!.push(item)
    }

    let totalNotifications = 0

    // For each organization, notify all active members
    for (const [orgId, items] of orgMap) {
      const { data: members } = await supabaseAdmin
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('is_active', true)

      if (!members || members.length === 0) continue

      const productNames = [...new Set(items.map(i => (i.product as { name?: string })?.name).filter(Boolean))] as string[]
      const title = productNames.length === 1
        ? `Garantía expirada: ${productNames[0]}`
        : `Garantías expiradas (${productNames.length} productos)`
      const message = productNames.length === 1
        ? `La garantía de ${productNames[0]} ha expirado hoy.`
        : `Las garantías de ${productNames.join(', ')} han expirado hoy.`

      const notifications = members.map(m => ({
        user_id: m.user_id,
        organization_id: orgId,
        type: 'warranty_expiration',
        title,
        message,
        href: '/inventory/products',
        metadata: {
          expired_count: items.length,
          product_names: productNames,
          date: today,
        },
      }))

      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.error(`Failed to create notifications for org ${orgId}:`, notifError)
        continue
      }

      totalNotifications += notifications.length
    }

    return new Response(
      JSON.stringify({
        processed: expiredItems.length,
        organizations: orgMap.size,
        notifications_created: totalNotifications,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
