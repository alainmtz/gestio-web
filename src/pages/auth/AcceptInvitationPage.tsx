import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Package, Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface InvitationData {
  id: string
  email: string
  role: string
  organization_id: string
  organization_name: string
  inviter_name: string
  expires_at: string
  accepted_at: string | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
}

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoadingState] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de invitación inválido')
      setLoadingState(false)
      return
    }

    const fetchInvitation = async () => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          organization_id,
          expires_at,
          accepted_at,
          organization:organizations(name),
          inviter:profiles!organization_invitations_invited_by_fkey(full_name)
        `)
        .eq('invitation_token', token)
        .single()

      if (error || !data) {
        setError('Invitación no encontrada o expirada')
        setLoadingState(false)
        return
      }

      const inv = data as any
      setInvitation({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        organization_id: inv.organization_id,
        organization_name: inv.organization?.name || 'Organización',
        inviter_name: inv.inviter?.full_name || 'Alguien',
        expires_at: inv.expires_at,
        accepted_at: inv.accepted_at,
      })
      setLoadingState(false)
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async () => {
    if (!invitation || !user) return

    setAccepting(true)
    try {
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error(`Esta invitación es para ${invitation.email}, no para ${user.email}`)
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: user.id,
          organization_id: invitation.organization_id,
          role: invitation.role,
          is_active: true,
        })

      if (memberError) throw memberError

      await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aceptar invitación')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitación no válida</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth/login')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) return null

  if (invitation.accepted_at) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Invitación aceptada</CardTitle>
            <CardDescription>Ya aceptaste esta invitación. Inicia sesión para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth/login')}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Invitación expirada</CardTitle>
            <CardDescription>
              Este enlace expiró el {new Date(invitation.expires_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth/login')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>¡Te han invitado a {invitation.organization_name}!</CardTitle>
          <CardDescription>
            {invitation.inviter_name} te invita a unirte a su organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">{invitation.inviter_name?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Te invita</p>
                <p className="font-medium">{invitation.inviter_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Organización</span>
              <span className="font-medium">{invitation.organization_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rol</span>
              <Badge variant="secondary">{ROLE_LABELS[invitation.role] ?? invitation.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expira</span>
              <span>{new Date(invitation.expires_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {isAuthenticated ? (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceptar invitación
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate(`/auth/register?invite=${token}`)}>
                <Mail className="mr-2 h-4 w-4" />
                Crear cuenta y aceptar
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => navigate('/auth/login')}
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
