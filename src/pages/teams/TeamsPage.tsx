import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, UsersRound, Edit, Trash2, Loader2, X, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

interface Team {
  id: string
  organization_id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
}

export function TeamsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamColor, setTeamColor] = useState('#6366f1')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
const [step, setStep] = useState(1)
const [selectedMembers, setSelectedMembers] = useState<Array<{ user_id: string; role: 'leader' | 'member'; full_name: string }>>([])
const [memberUserId, setMemberUserId] = useState('')
const [memberRole, setMemberRole] = useState<'leader' | 'member'>('member')

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data as Team[] || []
    },
    enabled: !!organizationId,
  })

  const { data: teamMembers } = useQuery({
    queryKey: ['teamMembers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('team_id, teams!inner(organization_id)')
        .eq('teams.organization_id', organizationId)
      
      const memberCounts: Record<string, number> = {}
      data?.forEach(m => {
        memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1
      })
      return memberCounts
    },
    enabled: !!organizationId,
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          organization_id: organizationId,
          name: teamName,
          description: teamDescription || null,
          color: teamColor,
        })
        .select()
        .single()
      if (error) throw error

      if (selectedMembers.length > 0) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert(selectedMembers.map(m => ({
            team_id: team.id,
            user_id: m.user_id,
            role: m.role,
          })))
        if (memberError) throw memberError
      }

      return team
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Equipo creado', description: 'El equipo se ha creado correctamente', variant: 'default' })
      closeDialog()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: teamName,
          description: teamDescription || null,
          color: teamColor,
        })
        .eq('id', editingTeam!.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Equipo actualizado', description: 'Los cambios se han guardado correctamente', variant: 'default' })
      closeDialog()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Equipo eliminado', description: 'El equipo se ha eliminado correctamente', variant: 'default' })
      setIsDeleting(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setIsDeleting(null)
    },
  })

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingTeam(null)
    setStep(1)
    setSelectedMembers([])
    setMemberUserId('')
    setMemberRole('member')
    setTeamName('')
    setTeamDescription('')
    setTeamColor('#6366f1')
  }

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team)
      setTeamName(team.name)
      setTeamDescription(team.description || '')
      setTeamColor(team.color)
    } else {
      setEditingTeam(null)
      setTeamName('')
      setTeamDescription('')
      setTeamColor('#6366f1')
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!teamName.trim()) return
    
    if (editingTeam) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (!deleteConfirmId) return
    setIsDeleting(deleteConfirmId)
    deleteMutation.mutate(deleteConfirmId)
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus equipos de trabajo</p>
        </div>
        {hasPermission(PERMISSIONS.TEAM_CREATE) && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Equipo</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: team.color }}>
                  <UsersRound className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {teamMembers?.[team.id] || 0} miembros
                  </p>
                </div>
              </div>
              {team.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{team.description}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Link to={`/teams/${team.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Gestionar
                  </Button>
                </Link>
                {hasPermission(PERMISSIONS.TEAM_DELETE) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive shrink-0"
                    onClick={() => handleDelete(team.id)}
                    disabled={isDeleting === team.id}
                  >
                    {isDeleting === team.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay equipos. Crea uno para comenzar.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Editar Equipo' : step === 1 ? 'Nuevo Equipo' : 'Agregar Miembros'}
            </DialogTitle>
            {!editingTeam && (
              <DialogDescription>Paso {step} de 2</DialogDescription>
            )}
          </DialogHeader>

          {editingTeam ? (
            /* ── Edit mode: simple form ── */
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del equipo</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ej: Equipo de Ventas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full ${teamColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTeamColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!teamName.trim() || updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar
                </Button>
              </DialogFooter>
            </>
          ) : step === 1 ? (
            /* ── Create Step 1: Team info ── */
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del equipo</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ej: Equipo de Ventas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full ${teamColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTeamColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button
                  onClick={() => { if (teamName.trim()) setStep(2) }}
                  disabled={!teamName.trim()}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* ── Create Step 2: Add members ── */
            <>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Usuario</Label>
                    <Select value={memberUserId} onValueChange={setMemberUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgUsers
                          ?.filter((u) => !selectedMembers.some((m) => m.user_id === u.id))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select
                      value={memberRole}
                      onValueChange={(v: 'leader' | 'member') => setMemberRole(v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Miembro</SelectItem>
                        <SelectItem value="leader">Líder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="icon"
                    disabled={!memberUserId}
                    onClick={() => {
                      const user = orgUsers?.find((u) => u.id === memberUserId)
                      if (user) {
                        setSelectedMembers((prev) => [
                          ...prev,
                          { user_id: user.id, role: memberRole, full_name: user.full_name },
                        ])
                        setMemberUserId('')
                        setMemberRole('member')
                      }
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Miembros seleccionados ({selectedMembers.length})</Label>
                    <div className="space-y-1">
                      {selectedMembers.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <span className="truncate">{m.full_name || m.user_id}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                m.role === 'leader'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted'
                              }`}
                            >
                              {m.role === 'leader' ? 'Líder' : 'Miembro'}
                            </span>
                            <button
                              onClick={() =>
                                setSelectedMembers((prev) => prev.filter((_, j) => j !== i))
                              }
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!orgUsers || orgUsers.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay usuarios disponibles en la organización
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || !teamName.trim()}
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Equipo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el equipo. Los miembros no serán eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}