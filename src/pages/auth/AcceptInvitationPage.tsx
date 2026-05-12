import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  const [googleLoading, setGoogleLoading] = useState(false)

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

      const { data: owners } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', invitation.organization_id)
        .eq('role', 'owner')
        .neq('user_id', user.id)

      if (owners && owners.length > 0) {
        const { data: newMember } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single()

        await supabase
          .from('notifications')
          .insert(
            owners.map((o) => ({
              user_id: o.user_id,
              organization_id: invitation.organization_id,
              type: 'member_joined',
              title: 'Nuevo miembro',
              message: `${invitation.email} se ha unido a la organización como ${invitation.role === 'owner' ? 'Propietario' : invitation.role === 'admin' ? 'Administrador' : 'Miembro'}.`,
              href: '/settings/members',
              metadata: {
                member_email: invitation.email,
                member_role: invitation.role,
                joined_at: new Date().toISOString(),
              },
            }))
          )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aceptar invitación')
    } finally {
      setAccepting(false)
    }
  }

  const handleGoogleLoginInvite = async () => {
    setGoogleLoading(true)
    setError(null)
    if (token) {
      localStorage.setItem('pending_invitation_token', token)
    }
    const redirectTo = window.location.origin + '/auth/callback'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
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
            <Button className="w-full" asChild>
              <Link to="/auth/login">Ir al login</Link>
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
            <Button className="w-full" asChild>
              <Link to="/auth/login">Iniciar sesión</Link>
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
            <Button className="w-full" asChild>
              <Link to="/auth/login">Ir al login</Link>
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
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to={`/auth/register?invite=${token}`}>
                <Mail className="mr-2 h-4 w-4" />
                Crear cuenta y aceptar
                </Link>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={googleLoading}
                onClick={handleGoogleLoginInvite}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link className="text-primary hover:underline" to="/auth/login">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
