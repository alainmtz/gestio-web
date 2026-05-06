import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Check, X, Loader2, Plus, Trash2, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { createNotifications } from '@/api/notifications'

interface WorkSchedule {
  id: string
  team_id: string
  customer_id: string
  store_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: string
  priority: string
  location?: string
  team?: { id: string; name: string; color: string }
  customer?: { name: string }
}

const statusConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  PENDING:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Completado', color: 'bg-blue-100 text-blue-800' },
  CANCELLED: { label: 'Cancelado',  color: 'bg-red-100 text-red-800' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Baja',   color: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Media',  color: 'bg-orange-100 text-orange-800' },
  HIGH:   { label: 'Alta',   color: 'bg-red-100 text-red-800' },
  URGENT: { label: 'Urgente', color: 'bg-red-200 text-red-900' },
}

export function SchedulesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const { hasPermission } = usePermissions()
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [customerId, setCustomerId] = useState('none')
  const [storeId, setStoreId] = useState('none')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('17:00')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [location, setLocation] = useState('')

  const { data: teams } = useQuery({
    queryKey: ['teams', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: stores } = useQuery({
    queryKey: ['stores', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['work_schedules', organizationId, selectedTeamId, selectedDate],
    queryFn: async () => {
      const dayStart = `${selectedDate}T00:00:00.000Z`
      const dayEnd   = `${selectedDate}T23:59:59.999Z`

      let query = supabase
        .from('work_schedules')
        .select(`
          id,
          team_id,
          customer_id,
          store_id,
          title,
          description,
          start_time,
          end_time,
          status,
          priority,
          location,
          team:teams(id, name, color),
          customer:customers(name)
        `)
        .eq('organization_id', organizationId)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .order('start_time')

      if (selectedTeamId !== 'all') {
        query = query.eq('team_id', selectedTeamId)
      }

      const { data } = await query
      return (data as unknown as WorkSchedule[]) || []
    },
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const startDateTime = `${startDate}T${startTime}:00`
      const endDateTime = `${endDate || startDate}T${endTime}:00`
      const { data, error } = await supabase
        .from('work_schedules')
        .insert({
          organization_id: organizationId,
          team_id: teamId,
          customer_id: customerId === 'none' ? null : customerId,
          store_id: storeId === 'none' ? null : storeId,
          title,
          description: description || null,
          start_time: startDateTime,
          end_time: endDateTime,
          priority,
          location: location || null,
          created_by: userId,
        })
        .select()
        .single()
      if (error) throw error
      return { data, startDateTime }
    },
    onSuccess: async ({ data: schedule, startDateTime }) => {
      queryClient.invalidateQueries({ queryKey: ['work_schedules'] })
      toast({ title: 'Trabajo creado', description: 'El trabajo se ha programado correctamente' })
      resetForm()

      const team = (teams || []).find((t: any) => t.id === teamId)
      const teamMembers = queryClient.getQueryData<any[]>(['team_members', teamId])
      if (teamMembers?.length) {
        try {
          const teamInfo = team?.name ? ` (${team.name})` : ''
          const customer = (customers || []).find((c: any) => c.id === customerId)
          const customerInfo = customer?.name ? ` · ${customer.name}` : ''
          const startFormatted = new Date(startDateTime).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          await createNotifications(teamMembers.map((m: any) => ({
            user_id: m.user_id,
            organization_id: organizationId!,
            type: 'task_assigned' as const,
            title: 'Nuevo trabajo asignado',
            message: `${title}${teamInfo}${customerInfo} — ${startFormatted}`,
            href: '/teams/schedules',
            metadata: { schedule_id: schedule.id, team_id: teamId, team_name: team?.name, customer_name: customer?.name },
          })))
        } catch {}
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_schedules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_schedules'] })
      toast({ title: 'Trabajo eliminado', description: 'Se ha eliminado correctamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('work_schedules')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['work_schedules'] })
      toast({ title: 'Estado actualizado' })

      const schedule = (queryClient.getQueryData<any[]>(['work_schedules']) || []).find((s: any) => s.id === id)
      if (schedule && userId) {
        const statusLabels: Record<string, string> = { CONFIRMED: 'confirmado', COMPLETED: 'completado', CANCELLED: 'cancelado' }
        const label = statusLabels[status] || status
        const teamName = schedule.team?.name ? ` (${schedule.team.name})` : ''
        const customerName = schedule.customer?.name ? ` · ${schedule.customer.name}` : ''
        try {
          await createNotifications([{
            user_id: userId,
            organization_id: organizationId!,
            type: 'status_change' as const,
            title: `Trabajo ${label}`,
            message: `${schedule.title}${teamName}${customerName} — Estado: ${label}`,
            href: '/teams/schedules',
            metadata: { schedule_id: id, new_status: status, team_name: schedule.team?.name, customer_name: schedule.customer?.name },
          }])
        } catch {}
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setShowCreateDialog(false)
    setTitle('')
    setDescription('')
    setTeamId('')
    setCustomerId('')
    setStoreId('')
    setStartDate('')
    setStartTime('09:00')
    setEndDate('')
    setEndTime('17:00')
    setPriority('MEDIUM')
    setLocation('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setStartDate(selectedDate)
    setEndDate(selectedDate)
    if (selectedTeamId !== 'all') setTeamId(selectedTeamId)
    setShowCreateDialog(true)
  }

  const handleCreate = () => {
    if (!title.trim() || !teamId || !startDate || !startTime) return
    createMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Horario de Equipos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visualiza y gestiona los trabajos asignados por fecha</p>
        </div>
        {hasPermission(PERMISSIONS.SCHEDULE_MANAGE) && (
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Trabajo
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Equipo</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los equipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los equipos</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trabajos del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : schedules && schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map((schedule) => {
                const cfg = statusConfig[schedule.status] || { label: schedule.status, color: 'bg-gray-100 text-gray-800' }
                const pCfg = priorityConfig[schedule.priority] || { label: schedule.priority, color: 'bg-gray-100 text-gray-700' }
                const startTime = new Date(schedule.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                const endTime = new Date(schedule.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={schedule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: schedule.team?.color || '#6366f1' }}
                      >
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.team?.name}
                          {schedule.customer?.name ? ` · ${schedule.customer.name}` : ''}
                          {' · '}{startTime} – {endTime}
                          {schedule.location ? ` · ${schedule.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Badge className={pCfg.color}>{pCfg.label}</Badge>
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${cfg.color}`}>
                        {schedule.status === 'CONFIRMED' && <Check className="h-3 w-3" />}
                        {schedule.status === 'CANCELLED' && <X className="h-3 w-3" />}
                        {cfg.label}
                      </span>
                      {hasPermission(PERMISSIONS.SCHEDULE_MANAGE) && (
                        <div className="flex gap-1">
                          {schedule.status === 'PENDING' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'CONFIRMED' })}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {(schedule.status === 'PENDING' || schedule.status === 'CONFIRMED') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'COMPLETED' })}>
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          {(schedule.status === 'PENDING' || schedule.status === 'CONFIRMED') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'CANCELLED' })}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(schedule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay trabajos asignados para esta fecha
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo Trabajo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Instalación de equipos" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del trabajo..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={(v: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cliente</SelectItem>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tienda</Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger><SelectValue placeholder="Sin tienda" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tienda</SelectItem>
                    {stores?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio *</Label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value) }} />
              </div>
              <div className="space-y-2">
                <Label>Hora inicio *</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora fin *</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dirección o lugar" className="pl-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !teamId || !startDate || !startTime || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
