import { supabase } from '@/lib/supabase'

export interface TeamSchedule {
  id: string
  team_id: string
  invoice_id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  confirmed_by: string | null
  confirmed_at: string | null
  notes: string | null
  organization_id: string
  created_at: string
  updated_at: string
  invoice?: {
    id: string
    document_number: string
    date: string
    due_date: string | null
    total: number
    status: string
    customer?: { name: string }
    store?: { name: string }
  }
  team?: {
    id: string
    name: string
    color: string
  }
}

export async function getTeamSchedules(teamId: string, organizationId: string): Promise<TeamSchedule[]> {
  const { data, error } = await supabase
    .from('team_schedules')
    .select(`
      *,
      invoice:invoices(id, document_number, date, due_date, total, status, customer:customers(name), store:stores(name)),
      team:teams(id, name, color)
    `)
    .eq('team_id', teamId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTeamScheduleByInvoice(invoiceId: string): Promise<TeamSchedule | null> {
  const { data, error } = await supabase
    .from('team_schedules')
    .select(`
      *,
      team:teams(id, name, color)
    `)
    .eq('invoice_id', invoiceId)
    .maybeSingle()

  if (error) {
    throw error
  }
  return data as TeamSchedule | null
}

export async function getConfirmedCountByDateAndTeam(
  teamId: string,
  date: string
): Promise<number> {
  const { data: schedules, error } = await supabase
    .from('team_schedules')
    .select('invoice_id, invoices!inner(date)')
    .eq('team_id', teamId)
    .eq('status', 'CONFIRMED')

  if (error) throw error

  const count = schedules?.filter(
    (s) => (s as { invoice?: { date: string } }).invoice?.date === date
  ).length || 0

  return count
}

export async function assignTeamToInvoice(
  invoiceId: string,
  teamId: string,
  organizationId: string
): Promise<TeamSchedule> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('date')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) throw new Error('Factura no encontrada')

  const { data: existingConfirmed, error: countError } = await supabase
    .from('team_schedules')
    .select('id', { count: 'exact' })
    .eq('team_id', teamId)
    .eq('status', 'CONFIRMED')
    .eq('organization_id', organizationId)

  if (countError) throw countError

  if ((existingConfirmed?.length || 0) >= 2) {
    throw new Error('El equipo ya tiene 2 trabajos confirmados para esta fecha')
  }

  const { data: existing } = await supabase
    .from('team_schedules')
    .select('id')
    .eq('invoice_id', invoiceId)
    .maybeSingle()

  if (existing) {
    throw new Error('Esta factura ya está asignada a un equipo')
  }

  await supabase
    .from('invoices')
    .update({ assigned_team_id: teamId })
    .eq('id', invoiceId)

  const { data, error } = await supabase
    .from('team_schedules')
    .insert({
      team_id: teamId,
      invoice_id: invoiceId,
      organization_id: organizationId,
    })
    .select()
    .single()

  if (error) throw error
  return data as TeamSchedule
}

export async function confirmSchedule(
  scheduleId: string,
  userId: string
): Promise<TeamSchedule> {
  const { data: schedule, error: fetchError } = await supabase
    .from('team_schedules')
    .select('team_id, invoice: invoices(date)')
    .eq('id', scheduleId)
    .single()

  if (fetchError) throw fetchError
  if (!schedule) throw new Error('Trabajo no encontrado')

  const invoiceDate = (schedule as unknown as { invoice?: { date: string } }).invoice?.date
  if (!invoiceDate) throw new Error('Factura sin fecha')

  const count = await getConfirmedCountByDateAndTeam(schedule.team_id, invoiceDate)
  if (count >= 2) {
    throw new Error('El equipo ya tiene 2 trabajos confirmados para esta fecha')
  }

  const { data, error } = await supabase
    .from('team_schedules')
    .update({
      status: 'CONFIRMED',
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error
  return data as TeamSchedule
}

export async function completeSchedule(scheduleId: string): Promise<TeamSchedule> {
  const { data, error } = await supabase
    .from('team_schedules')
    .update({ status: 'COMPLETED' })
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error
  return data as TeamSchedule
}

export async function cancelSchedule(scheduleId: string): Promise<TeamSchedule> {
  const { data: schedule } = await supabase
    .from('team_schedules')
    .select('invoice_id')
    .eq('id', scheduleId)
    .maybeSingle()

  if (schedule) {
    await supabase
      .from('invoices')
      .update({ assigned_team_id: null })
      .eq('id', schedule.invoice_id)
  }

  const { data, error } = await supabase
    .from('team_schedules')
    .update({ status: 'CANCELLED' })
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error
  return data as TeamSchedule
}

export async function removeTeamFromInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('team_schedules')
    .delete()
    .eq('invoice_id', invoiceId)

  if (error) throw error

  await supabase
    .from('invoices')
    .update({ assigned_team_id: null })
    .eq('id', invoiceId)
}