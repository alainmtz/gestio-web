import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, Trash2, Loader2, Shield, Mail, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member'
  role_id?: string | null
  is_active: boolean
  invited_by?: string
  created_at: string
  user?: {
    email: string
    full_name?: string
  }
}

interface Role {
  id: string
  name: string
  description?: string
  is_system_role: boolean
}

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  org_owner: 'Propietario',
  org_admin: 'Administrador',
  store_manager: 'Gerente de Tienda',
  cashier: 'Cajero',
  viewer: 'Solo Lectura',
}

const LEGACY_ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  owner: { label: 'Propietario', variant: 'default' },
  admin: { label: 'Administrador', variant: 'secondary' },
  member: { label: 'Miembro', variant: 'outline' },
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const { hasPermission } = usePermissions()

  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteRoleId, setInviteRoleId] = useState<string>('none')

  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null)
  const [editRoleId, setEditRoleId] = useState<string>('none')
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)

  const { data: members, isLoading } = useQuery({
    queryKey: ['organizationMembers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('*, user:profiles(email, full_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      return (data as OrganizationMember[]) || []
    },
    enabled: !!organizationId,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description, is_system_role')
        .eq('organization_id', organizationId)
        .order('is_system_role', { ascending: false })
        .order('name')
      if (error) throw error
      return data as Role[]
    },
    enabled: !!organizationId,
  })

  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]))

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No hay organización seleccionada')
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          organization_id: organizationId,
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUserId,
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Invitación enviada', description: `Se envió invitación a ${inviteEmail}`, variant: 'default' })
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRoleId('none')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string; roleId: string | null }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role_id: roleId })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })
      toast({ title: 'Rol actualizado', variant: 'default' })
      setEditingMember(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })
      setRemoveTargetId(null)
      toast({ title: 'Miembro removido', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['organizationInvitations', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_invitations')
        .select('id, email, role, created_at, expires_at')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!organizationId && hasPermission(PERMISSIONS.MEMBER_INVITE),
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', inviteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationInvitations'] })
      toast({ title: 'Invitación cancelada', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  function getRoleBadge(member: OrganizationMember) {
    if (member.role_id && roleById[member.role_id]) {
      const r = roleById[member.role_id]
      const label = SYSTEM_ROLE_LABELS[r.name] ?? r.name
      return <Badge variant={r.is_system_role ? 'secondary' : 'outline'}>{label}</Badge>
    }
    const fallback = LEGACY_ROLE_LABELS[member.role] ?? { label: member.role, variant: 'outline' as const }
    return <Badge variant={fallback.variant}>{fallback.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">Gestiona los miembros de tu organización</p>
        </div>
        {hasPermission(PERMISSIONS.MEMBER_INVITE) && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar Miembro
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros de la Organización ({members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">
                        {member.user?.full_name?.[0] || member.user?.email?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user?.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    {getRoleBadge(member)}
                    {member.role !== 'owner' && member.user_id !== currentUserId && (
                      <>
                        {hasPermission(PERMISSIONS.MEMBER_ROLE) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Cambiar rol"
                            onClick={() => {
                              setEditingMember(member)
                              setEditRoleId(member.role_id ?? 'none')
                            }}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission(PERMISSIONS.MEMBER_REMOVE) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Remover miembro"
                            onClick={() => setRemoveTargetId(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay miembros en esta organización.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invite Dialog ── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
            <DialogDescription>
              Envía una invitación por email para que un usuario se una a tu organización.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol base</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol de permisos (opcional)</Label>
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin rol específico</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {SYSTEM_ROLE_LABELS[r.name] ?? r.name}
                      {!r.is_system_role && ' (personalizado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define qué acciones puede realizar este miembro en la aplicación.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Role Dialog ── */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol de permisos</DialogTitle>
            <DialogDescription>
              Asigna un rol de permisos a un miembro de la organización.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rol de permisos</Label>
            <Select value={editRoleId} onValueChange={setEditRoleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin rol específico (usar rol base)</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {SYSTEM_ROLE_LABELS[r.name] ?? r.name}
                    {!r.is_system_role && ' (personalizado)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editingMember &&
                updateRoleMutation.mutate({
                  memberId: editingMember.id,
                  roleId: editRoleId !== 'none' ? editRoleId : null,
                })
              }
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Remove Dialog ── */}
      <AlertDialog open={!!removeTargetId} onOpenChange={(open) => !open && setRemoveTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              El miembro perderá acceso a la organización. Esta acción puede revertirse reactivando al miembro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTargetId && removeMutation.mutate(removeTargetId)}
            >
              {removeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Pending Invitations ── */}
      {hasPermission(PERMISSIONS.MEMBER_INVITE) && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitaciones Pendientes ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Rol: {LEGACY_ROLE_LABELS[inv.role]?.label ?? inv.role} · Expira:{' '}
                      {new Date(inv.expires_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Cancelar invitación"
                    onClick={() => cancelInviteMutation.mutate(inv.id)}
                    disabled={cancelInviteMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
