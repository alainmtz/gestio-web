import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, UsersRound, Edit, Trash2, Loader2 } from 'lucide-react'
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
        .select('team_id')
        .eq('organization_id', organizationId)
      
      const memberCounts: Record<string, number> = {}
      data?.forEach(m => {
        memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1
      })
      return memberCounts
    },
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
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
      return data
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">Gestiona tus equipos de trabajo</p>
        </div>
        {hasPermission(PERMISSIONS.TEAM_CREATE) && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Equipo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full" style={{ backgroundColor: team.color }} />
                <div>
                  <h3 className="font-medium">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {teamMembers?.[team.id] || 0} miembros
                  </p>
                </div>
              </div>
              {team.description && (
                <p className="mt-2 text-sm text-muted-foreground">{team.description}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Link to={`/teams/${team.id}`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission(PERMISSIONS.TEAM_DELETE) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle>
          </DialogHeader>
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
            <Button onClick={handleSave} disabled={!teamName.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingTeam ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
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