import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Check, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
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

export function SchedulesPage() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Horario de Equipos</h1>
        <p className="text-muted-foreground">Visualiza los trabajos asignados por fecha</p>
      </div>

      <div className="flex gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Equipo</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-[200px]">
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
            className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                const startTime = new Date(schedule.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                const endTime = new Date(schedule.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: schedule.team?.color || '#6366f1' }}
                      >
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.team?.name}
                          {schedule.customer?.name ? ` · ${schedule.customer.name}` : ''}
                          {' · '}{startTime} – {endTime}
                          {schedule.location ? ` · ${schedule.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${cfg.color}`}>
                        {schedule.status === 'CONFIRMED' && <Check className="h-3 w-3" />}
                        {schedule.status === 'CANCELLED' && <X className="h-3 w-3" />}
                        {cfg.label}
                      </span>
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
    </div>
  )
}
