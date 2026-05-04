import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, type User, type Organization } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Package, Loader2, Mail, AlertCircle } from 'lucide-react'

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  organizationName: z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const inviteSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>
type InviteForm = z.infer<typeof inviteSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const { login, setLoading, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const [inviteData, setInviteData] = useState<{
    organization_name: string
    inviter_name: string
    role: string
    email: string
  } | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm | InviteForm>({
    resolver: zodResolver(inviteToken ? inviteSchema : registerSchema),
  })

  useEffect(() => {
    if (!inviteToken) return

    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          expires_at,
          organization:organizations(name),
          inviter:profiles!organization_invitations_invited_by_fkey(full_name)
        `)
        .eq('invitation_token', inviteToken)
        .single()

      if (error || !data) {
        setLoadingInvite(false)
        setError('Invitación no válida o expirada')
        return
      }

      const inv = data as any
      if (new Date(inv.expires_at) < new Date()) {
        setLoadingInvite(false)
        setError('Esta invitación ha expirado')
        return
      }

      const inviteInfo = {
        organization_name: inv.organization?.name || 'Organización',
        inviter_name: inv.inviter?.full_name || 'Alguien',
        role: inv.role,
        email: inv.email,
      }
      setInviteData(inviteInfo)
      setValue('email', inviteInfo.email)
      setLoadingInvite(false)
    }

    fetchInvite()
  }, [inviteToken, setValue])

  const onSubmit = async (data: RegisterForm | InviteForm) => {
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user || authData.session === null) {
        setError('Por favor verifica tu correo electrónico para continuar.')
        setLoading(false)
        return
      }

      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      })

      const userId = authData.user.id

      if (inviteToken && inviteData) {
        // Join invited organization
        const { data: invitation } = await supabase
          .from('organization_invitations')
          .select('organization_id')
          .eq('invitation_token', inviteToken)
          .single()

        if (!invitation) {
          throw new Error('Invitación no encontrada')
        }

        await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: data.fullName,
          })

        await supabase
          .from('organization_members')
          .insert({
            user_id: userId,
            organization_id: invitation.organization_id,
            role: inviteData.role,
            is_active: true,
          })

        await supabase
          .from('organization_invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('invitation_token', inviteToken)

        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', invitation.organization_id)
          .single()

        const user: User = {
          id: userId,
          email: data.email,
          fullName: data.fullName,
        }

        const organizations: Organization[] = [{
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
        }]

        login(user, {
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at || Date.now() + 3600000,
        }, organizations)
      } else {
        // Create own organization
        const fullData = data as RegisterForm
        const slugBase = fullData.organizationName.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        const slug = `${slugBase}-${Date.now()}`

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: fullData.organizationName,
            slug: slug,
          })
          .select()
          .single()

        if (orgError) {
          throw new Error('No se pudo crear la organización: ' + orgError.message)
        }

        await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: data.fullName,
            organization_id: orgData.id,
          })

        await supabase
          .from('organization_members')
          .insert({
            user_id: userId,
            organization_id: orgData.id,
            role: 'owner',
          })

        const user: User = {
          id: userId,
          email: data.email,
          fullName: data.fullName,
          organizationId: orgData.id,
        }

        const organizations: Organization[] = [{
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          plan: orgData.subscription_plan || 'FREE',
        }]

        login(user, {
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at || Date.now() + 3600000,
        }, organizations)
      }

      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta. Por favor intenta de nuevo.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    member: 'Miembro',
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            {inviteData ? <Mail className="h-6 w-6 text-primary-foreground" /> : <Package className="h-6 w-6 text-primary-foreground" />}
          </div>
          {inviteData ? (
            <>
              <CardTitle className="text-2xl">Únete a {inviteData.organization_name}</CardTitle>
              <CardDescription>
                {inviteData.inviter_name} te invita. Crea tu cuenta para aceptar.
              </CardDescription>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[inviteData.role] ?? inviteData.role}</Badge>
              </div>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>
                Regístrate para comenzar a usar Gestio
              </CardDescription>
            </>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {!inviteData && (
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nombre de la organización</Label>
                <Input
                  id="organizationName"
                  placeholder="Mi Empresa"
                  {...register('organizationName')}
                />
                {('organizationName' in errors) && (errors as any).organizationName && (
                  <p className="text-sm text-destructive">{(errors as any).organizationName.message}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{(errors as any).fullName?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                readOnly={!!inviteData}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{(errors as any).email?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                data-testid="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{(errors as any).password?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                data-testid="confirmPassword"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{(errors as any).confirmPassword?.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {inviteData ? 'Crear cuenta y aceptar' : 'Crear Cuenta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
