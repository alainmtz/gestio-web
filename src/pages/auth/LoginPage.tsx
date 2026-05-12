import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, type User, type Organization } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
   Inline SVG icons (no external hosts)
   ────────────────────────────────────────────────────────────────────────── */

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Star field (pure CSS)
   ────────────────────────────────────────────────────────────────────────── */

const STAR_SHADOWS = [
  // layer 1 — small dim stars
  `${(() => {
    const pts: string[] = []
    for (let i = 0; i < 80; i++) {
      pts.push(`${Math.random() * 2000}px ${Math.random() * 1000}px rgba(255,255,255,${0.15 + Math.random() * 0.25})`)
    }
    return pts.join(', ')
  })()}`,
  // layer 2 — medium stars
  `${(() => {
    const pts: string[] = []
    for (let i = 0; i < 40; i++) {
      pts.push(`${Math.random() * 2000}px ${Math.random() * 1000}px rgba(255,255,255,${0.3 + Math.random() * 0.35})`)
    }
    return pts.join(', ')
  })()}`,
]

/* ──────────────────────────────────────────────────────────────────────────
   Login page
   ────────────────────────────────────────────────────────────────────────── */

export function LoginPage() {
  const navigate = useNavigate()
  const { login, setPendingOrganizations, setLoading, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Form state (kept simple — no RHF dependency for the redesign)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false })

  const emailError = touched.email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordError = touched.password && password.length > 0 && password.length < 6
  const canSubmit = email.length > 0 && password.length >= 6 && !emailError

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
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
        email: authData.user.email || email,
        fullName: profileData?.full_name || authData.user.email?.split('@')[0] || 'Usuario',
        avatarUrl: profileData?.avatar_url || undefined,
      }

      // Fetch organizations
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, role, is_active')
        .eq('user_id', authData.user.id)

      const activeMemberships = memberships?.filter(m => m.is_active) || []
      const pendingMemberships = memberships?.filter(m => !m.is_active) || []

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

      login(user, {
        accessToken: authData.session.access_token,
        expiresAt: authData.session.expires_at || Date.now() + 3600000,
      }, organizations)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Google OAuth ── */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    const redirectTo = window.location.origin + '/auth/callback'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a1a] p-4 selection:bg-primary/30">
      {/* ── Star field ── */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 animate-[star-drift_60s_linear_infinite]"
          style={{
            boxShadow: STAR_SHADOWS[0],
            borderRadius: '50%',
            width: '2px',
            height: '2px',
            color: 'transparent',
            left: '-10px',
            top: '-10px',
          }}
        />
        <div
          className="absolute inset-0 animate-[star-drift_120s_linear_infinite]"
          style={{
            boxShadow: STAR_SHADOWS[1],
            borderRadius: '50%',
            width: '3px',
            height: '3px',
            color: 'transparent',
            left: '-10px',
            top: '-10px',
          }}
        />
        {/* Twinkle overlays */}
        <div className="absolute inset-0 animate-[star-twinkle_3s_ease-in-out_infinite_alternate]" />
      </div>

      {/* ── Gradient glow ── */}
      <div
        className="pointer-events-none fixed -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          width: '100%',
          height: '600px',
          top: '-100px',
        }}
      />

      {/* ── Animated grid lines ── */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Inline animations ── */}
      <style>{`
        @keyframes star-drift {
          from { transform: translateX(0) translateY(0); }
          to { transform: translateX(-200px) translateY(-80px); }
        }
        @keyframes star-twinkle {
          0% { background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%); }
          100% { background: radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.06) 0%, transparent 50%); }
        }
        @keyframes card-enter {
          0% { opacity: 0; transform: scale(0.96) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes brand-glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 6px hsl(var(--primary) / 0.2)); }
          50% { filter: brightness(1.1) drop-shadow(0 0 14px hsl(var(--primary) / 0.4)); }
        }
        @keyframes form-enter {
          0% { opacity: 0; transform: translateX(10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-12px) scale(1.2); opacity: 0.6; }
        }
      `}</style>

      {/* ── Card ── */}
      <div
        className="
          mx-auto flex w-full max-w-[880px] animate-[card-enter_0.6s_ease-out]
          flex-col overflow-hidden rounded-2xl border border-border/60
          bg-card/70 shadow-2xl shadow-primary/5 backdrop-blur-xl
          md:flex-row
        "
      >
        {/* ══ Brand side (left) ══ */}
        <div
          className="
            relative flex min-h-[180px] flex-col items-center justify-center
            gap-3 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5
            to-transparent p-8 text-center md:min-h-[500px] md:w-[38%] md:p-10
          "
        >
          {/* Decorative orbs */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 size-28 rounded-full bg-primary/8 blur-2xl"
            aria-hidden="true"
          />

          {/* Floating particles */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="pointer-events-none absolute size-1.5 rounded-full bg-primary/30"
              aria-hidden="true"
              style={{
                top: `${30 + i * 25}%`,
                left: `${15 + i * 30}%`,
                animation: `float-particle ${2.5 + i * 0.6}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}

          {/* Wordmark */}
          <div className="relative z-10 animate-[brand-glow_4s_ease-in-out_infinite]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <svg
                viewBox="0 0 24 24"
                className="size-7 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              Gestio Web
            </h1>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Gesti&oacute;n empresarial simplificada
            </p>
          </div>

          {/* Decorative line pattern */}
          <div
            className="relative z-10 mt-4 flex gap-1.5"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="block h-1 w-6 rounded-full bg-primary/30"
                style={{
                  animation: `float-particle 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Desktop tagline */}
          <p className="relative z-10 mt-2 hidden max-w-[200px] text-xs leading-relaxed text-muted-foreground/60 md:block">
            Controla tu inventario, facturaci&oacute;n y equipo en un solo lugar.
          </p>
        </div>

        {/* ══ Form side (right) ══ */}
        <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
          <div className="mx-auto w-full max-w-sm animate-[form-enter_0.5s_ease-out_0.2s_both]">
            {/* Headline */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electr&oacute;nico
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    className={cn(
                      'pl-9 transition-shadow duration-200',
                      emailError && 'border-destructive/70 ring-3 ring-destructive/15',
                    )}
                    aria-invalid={emailError || undefined}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                {emailError && (
                  <p id="email-error" className="text-xs text-destructive" role="alert">
                    Ingresa un correo v&aacute;lido
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contrase&ntilde;a
                  </Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-primary/80 hover:text-primary hover:underline transition-colors"
                  >
                    &iquest;Olvidaste tu contrase&ntilde;a?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    data-testid="password"
                    className={cn(
                      'pl-9 pr-9 transition-shadow duration-200',
                      passwordError && 'border-destructive/70 ring-3 ring-destructive/15',
                    )}
                    aria-invalid={passwordError || undefined}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                  />
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="text-xs text-destructive" role="alert">
                    M&iacute;nimo 6 caracteres
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {isLoading ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>

            {/* ── OR divider ── */}
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-medium text-muted-foreground/60">O contin&uacute;a con</span>
              <span className="h-px flex-1 bg-border/60" />
            </div>

            {/* ── Social buttons ── */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
              >
                {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleLogo />}
                Google
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-2 border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                disabled
              >
                <AppleLogo />
                Apple
              </Button>
            </div>

            {/* ── Sign-up footer ── */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              &iquest;No tienes cuenta?{' '}
              <Link
                to="/auth/register"
                className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                Reg&iacute;strate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Tiny local cn helper to avoid importing RHF deps */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
