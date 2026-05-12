import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, Plus, Trash2, UserPlus, Calendar, Check, X, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { useTeamSchedules, useConfirmSchedule, useCompleteSchedule, useCancelSchedule } from '@/hooks/useSchedules'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

interface Team {
  id: string
  organization_id: string
  name: string
  description?: string
  color: string
  is_active: boolean
}

interface TeamMember {
  team_id: string
  user_id: string
  role: 'leader' | 'member'
  user?: {
    full_name: string
    email: string
  }
}

export function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'leader' | 'member'>('member')

  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('*').eq('id', id).maybeSingle()
      return data as Team
    },
    enabled: !!id,
  })

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['teamMembers', id],
    queryFn: async () => {
      const { data: rawMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', id)

      if (!rawMembers || rawMembers.length === 0) return []

      const userIds = rawMembers.map((m) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

      return (rawMembers as TeamMember[]).map((m) => ({
        ...m,
        user: profileMap.get(m.user_id) || undefined,
      }))
    },
    enabled: !!id,
  })

  const { data: orgUsers } = useQuery({
    queryKey: ['organizationUsers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('user_id, profile:profiles(id, full_name, email)')
        .eq('organization_id', organizationId)
      return (data || []).map((m: any) => ({
        id: m.user_id,
        full_name: m.profile?.full_name || '',
        email: m.profile?.email || '',
      }))
    },
    enabled: !!organizationId,
  })

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: id,
          user_id: selectedUserId,
          role: selectedRole,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', id] })
      toast({ title: 'Miembro agregado', description: 'El miembro se ha agregado al equipo', variant: 'default' })
      setShowAddMember(false)
      setSelectedUserId('')
      setSelectedRole('member')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', id] })
      toast({ title: 'Miembro eliminado', description: 'El miembro ha sido eliminado del equipo', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const existingMemberIds = members?.map(m => m.user_id) || []
  const availableUsers = orgUsers?.filter(u => !existingMemberIds.includes(u.id)) || []
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isLeader = members?.some(m => m.user_id === currentUserId && m.role === 'leader') || false
  const { hasPermission } = usePermissions()

  const { data: schedules, isLoading: isLoadingSchedules } = useTeamSchedules(id!)
  const confirmMutation = useConfirmSchedule()
  const completeMutation = useCompleteSchedule()
  const cancelMutation = useCancelSchedule()

  if (loadingTeam) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/teams">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Equipo no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/teams">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{team.name}</h1>
            {team.description && (
              <p className="text-sm text-muted-foreground truncate">{team.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Miembros del Equipo ({members?.length || 0})</CardTitle>
            {hasPermission(PERMISSIONS.TEAM_EDIT) && (
            <Button size="sm" onClick={() => setShowAddMember(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={`${member.team_id}-${member.user_id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm shrink-0">
                        {member.user?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{member.user?.full_name || 'Usuario'}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <span className={`text-xs px-2 py-1 rounded ${member.role === 'leader' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                        {member.role === 'leader' ? 'Líder' : 'Miembro'}
                      </span>
                      {hasPermission(PERMISSIONS.TEAM_EDIT) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        onClick={() => removeMemberMutation.mutate({ teamId: member.team_id, userId: member.user_id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay miembros en este equipo
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Nombre</Label>
              <p className="font-medium">{team.name}</p>
            </div>
            {team.description && (
              <div>
                <Label className="text-muted-foreground">Descripción</Label>
                <p>{team.description}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
                <span>{team.color}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Trabajos ({schedules?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : schedules && schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{schedule.invoice?.document_number || 'Sin número'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {schedule.invoice?.customer?.name || 'Sin cliente'} • Bs. {(schedule.invoice?.total || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className={`text-xs px-2 py-1 rounded ${
                      schedule.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      schedule.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      schedule.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {schedule.status === 'PENDING' ? 'Pendiente' :
                       schedule.status === 'CONFIRMED' ? 'Confirmado' :
                       schedule.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                    </span>
                    {schedule.status === 'PENDING' && isLeader && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-green-600 h-8 w-8"
                        onClick={() => confirmMutation.mutate(schedule.id)}
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {schedule.status === 'CONFIRMED' && isLeader && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-blue-600 h-8 w-8"
                        onClick={() => completeMutation.mutate(schedule.id)}
                        disabled={completeMutation.isPending}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                    {(schedule.status === 'PENDING' || schedule.status === 'CONFIRMED') && isLeader && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        onClick={() => cancelMutation.mutate(schedule.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay trabajos asignados a este equipo
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddMember} onOpenChange={(open) => { if (!open) { setShowAddMember(false); setSelectedUserId(''); setSelectedRole('member') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={selectedRole} onValueChange={(v: 'leader' | 'member') => setSelectedRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="leader">Líder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancelar</Button>
            <Button onClick={() => addMemberMutation.mutate()} disabled={!selectedUserId || addMemberMutation.isPending}>
              {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}