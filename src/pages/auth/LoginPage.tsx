import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, type User, type Organization } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Package, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, setPendingOrganizations, setLoading, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setLoading(true)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || data.email,
        fullName: profileData?.full_name || authData.user.email?.split('@')[0] || 'Usuario',
        avatarUrl: profileData?.avatar_url || undefined,
      }

      // Fetch organizations where user is member (active + pending)
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, role, is_active')
        .eq('user_id', authData.user.id)

      const activeMemberships = memberships?.filter(m => m.is_active) || []
      const pendingMemberships = memberships?.filter(m => !m.is_active) || []

      // If no memberships at all, check for pending invitations
      if (!memberships || memberships.length === 0) {
        const { data: pendingInvites } = await supabase
          .from('organization_invitations')
          .select('invitation_token, organization_id')
          .eq('email', authData.user.email?.toLowerCase())
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())

        if (pendingInvites && pendingInvites.length > 0) {
          navigate(`/accept-invitation/${pendingInvites[0].invitation_token}`)
          setLoading(false)
          return
        }

        throw new Error('No perteneces a ninguna organización')
      }

      user.role = activeMemberships[0]?.role || pendingMemberships[0]?.role || 'MEMBER'

      // Fetch active organizations
      const activeOrgIds = activeMemberships.map(m => m.organization_id)
      const { data: activeOrgs } = activeOrgIds.length > 0
        ? await supabase.from('organizations').select('*').in('id', activeOrgIds).eq('is_active', true)
        : { data: null }

      const organizations: Organization[] = activeOrgs?.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        taxId: org.tax_id || undefined,
        plan: org.plan,
        logoUrl: org.logo_url || undefined,
      })) || []

      // Fetch pending organizations
      const pendingOrgIds = pendingMemberships.map(m => m.organization_id)
      const { data: pendingOrgs } = pendingOrgIds.length > 0
        ? await supabase.from('organizations').select('*').in('id', pendingOrgIds)
        : { data: null }

      const pendingOrganizations: Organization[] = pendingOrgs?.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        taxId: org.tax_id || undefined,
        plan: org.plan,
        logoUrl: org.logo_url || undefined,
      })) || []

      setPendingOrganizations(pendingOrganizations)

      if (organizations.length === 0 && pendingOrganizations.length === 0) {
        throw new Error('No tienes organizaciones activas')
      }

      login(
        user,
        {
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at || Date.now() + 3600000,
        },
        organizations
      )
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/auth/register" className="text-primary hover:underline">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
