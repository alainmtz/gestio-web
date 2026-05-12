import { useState, useEffect, useRef, useId, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, type User, type Organization } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Package, Loader2, Mail, AlertCircle, Check,
  ChevronRight, ChevronLeft, Upload, Sparkles, RotateCcw,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
   Schemas
   ────────────────────────────────────────────────────────────────────────── */

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

const oauthSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  organizationName: z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
})

type RegisterForm = z.infer<typeof registerSchema>
type InviteForm = z.infer<typeof inviteSchema>
type OAuthForm = z.infer<typeof oauthSchema>

/* ──────────────────────────────────────────────────────────────────────────
   Google Logo SVG
   ────────────────────────────────────────────────────────────────────────── */

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Steps config
   ────────────────────────────────────────────────────────────────────────── */

const REGULAR_STEPS = [
  { label: 'Cuenta', description: 'Tus datos' },
  { label: 'Empresa', description: 'Organización' },
  { label: 'Revisar', description: 'Verificación' },
  { label: 'Listo', description: 'Finalizar' },
] as const

const OAUTH_STEPS = [
  { label: 'Perfil', description: 'Tus datos Google' },
  { label: 'Empresa', description: 'Organización' },
  { label: 'Revisar', description: 'Verificación' },
  { label: 'Listo', description: 'Finalizar' },
] as const

const INVITE_STEPS = [
  { label: 'Cuenta', description: 'Tus datos' },
  { label: 'Listo', description: 'Finalizar' },
] as const

/* ──────────────────────────────────────────────────────────────────────────
   Microinteraction: Upload progress (compact)
   ────────────────────────────────────────────────────────────────────────── */

function useInterval(cb: () => void, ms: number | null) {
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  useEffect(() => {
    if (ms === null) return
    const id = setInterval(() => saved.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}

function CompactUploadProgress() {
  const id = useId()
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const statusId = 'cupload-status-' + id

  const start = useCallback(() => {
    if (running) return
    setProgress(0)
    setRunning(true)
  }, [running])

  useInterval(
    () => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 18 + 2, 100)
        if (next >= 100) { setRunning(false); return 100 }
        return next
      })
    },
    running ? 350 : null,
  )
  const reset = () => { setProgress(0); setRunning(false) }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Upload className="size-3.5" />
        <span>Logo de la organizaci&oacute;n (opcional)</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de subida"
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            progress === 100 ? 'bg-green-500' : 'bg-primary',
            running && progress < 100 && 'animate-pulse',
          )}
          style={{ width: progress + '%' }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span id={statusId} aria-live="polite">
          {progress === 0 && 'Sin archivo'}
          {progress > 0 && progress < 100 && 'Subiendo... ' + Math.round(progress) + '%'}
          {progress === 100 && 'Logo subido!'}
        </span>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={start} disabled={running || progress === 100}>
            Subir
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={reset} disabled={progress === 0}>
            Reiniciar
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Microinteraction: Checklist (compact)
   ────────────────────────────────────────────────────────────────────────── */

const ONBOARDING_CHECKLIST = [
  { id: 'a', label: 'Crear cuenta de usuario' },
  { id: 'b', label: 'Configurar organizaci&oacute;n' },
  { id: 'c', label: 'Verificar correo electr&oacute;nico' },
  { id: 'd', label: 'Acceder al panel principal' },
]

function CompactChecklist({ animating, done }: { animating: boolean; done: string[] }) {
  const id = useId()
  const statusId = 'cchecklist-status-' + id

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground" id={statusId} aria-live="polite">
        {done.length === 0 && 'Pasos pendientes'}
        {done.length > 0 && done.length < ONBOARDING_CHECKLIST.length && done.length + ' de ' + ONBOARDING_CHECKLIST.length + ' pasos'}
        {done.length === ONBOARDING_CHECKLIST.length && 'Todo listo!'}
      </p>
      <ul className="space-y-1">
        {ONBOARDING_CHECKLIST.map((item) => {
          const checked = done.includes(item.id)
          return (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all duration-300',
                checked && 'bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                  checked ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground/30',
                  checked && 'animate-[step-bounce_0.4s_ease-out]',
                )}
                aria-hidden="true"
              >
                {checked && <Check className="size-2.5" />}
              </span>
              <span className={cn('transition-colors', checked && 'text-muted-foreground line-through')}>
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Microinteraction: Success confirmation (compact)
   ────────────────────────────────────────────────────────────────────────── */

function CompactSuccess({ message }: { message: string }) {
  const particles = [0, 1, 2, 3, 4, 5]
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative flex size-16 items-center justify-center rounded-full bg-green-500 animate-in zoom-in-50 duration-500">
        <Check className="size-7 text-white" />
        <span className="absolute inset-0" aria-hidden="true">
          {particles.map((i) => (
            <span
              key={i}
              className="absolute size-1 rounded-full bg-green-400"
              style={{
                top: (Math.sin((i * 60 * Math.PI) / 180) * 32 + 50) + '%',
                left: (Math.cos((i * 60 * Math.PI) / 180) * 32 + 50) + '%',
                animation: 'cs-particle 0.8s ease-out ' + (i * 0.08) + 's forwards',
                opacity: 0,
              }}
            />
          ))}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500">
        Ser&aacute;s redirigido al panel principal&hellip;
      </p>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────────────────── */

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const oauthFlow = searchParams.get('oauth_flow') === 'true'

  const { login, setLoading, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const [inviteData, setInviteData] = useState<{
    organization_name: string
    inviter_name: string
    role: string
    email: string
  } | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken)

  const [oauthData, setOauthData] = useState<{
    email: string
    fullName: string
    avatarUrl: string
  } | null>(null)

  const isInvite = !!inviteData
  const steps = isInvite ? INVITE_STEPS : oauthFlow ? OAUTH_STEPS : REGULAR_STEPS
  const maxStep = steps.length - 1

  const [currentStep, setCurrentStep] = useState(0)

  const [checklistAnimating, setChecklistAnimating] = useState(false)
  const [checklistDone, setChecklistDone] = useState<string[]>([])

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const schema = inviteToken
    ? inviteSchema
    : oauthFlow
      ? oauthSchema
      : registerSchema

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm | InviteForm | OAuthForm>({
    resolver: zodResolver(schema),
    shouldUnregister: false,
  })

  /* ── Load Google OAuth data ── */
  useEffect(() => {
    if (!oauthFlow) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        const googleData = {
          email: session.user.email || '',
          fullName: meta.full_name || meta.name || '',
          avatarUrl: meta.avatar_url || meta.picture || '',
        }
        setOauthData(googleData)
        setValue('fullName', googleData.fullName)
      }
    })
  }, [oauthFlow, setValue])

  /* ── Fetch invite data ── */
  useEffect(() => {
    if (!inviteToken) return

    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select([
          'id',
          'email',
          'role',
          'expires_at',
          'organization:organizations(name)',
          'inviter:profiles!organization_invitations_invited_by_fkey(full_name)',
        ].join(','))
        .eq('invitation_token', inviteToken)
        .single()

      if (error || !data) {
        setLoadingInvite(false)
        setError('Invitaci&oacute;n no v&aacute;lida o expirada')
        return
      }
      const inv = data as any
      if (new Date(inv.expires_at) < new Date()) {
        setLoadingInvite(false)
        setError('Esta invitaci&oacute;n ha expirado')
        return
      }
      setInviteData({
        organization_name: inv.organization?.name || 'Organizaci&oacute;n',
        inviter_name: inv.inviter?.full_name || 'Alguien',
        role: inv.role,
        email: inv.email,
      })
      setValue('email', inv.email)
      setLoadingInvite(false)
    }
    fetchInvite()
  }, [inviteToken, setValue])

  /* ── Checklist auto-advance ── */
  useEffect(() => {
    if (!checklistAnimating) return
    if (checklistDone.length >= ONBOARDING_CHECKLIST.length) {
      setChecklistAnimating(false)
      return
    }
    const t = setTimeout(() => {
      setChecklistDone((prev) => [...prev, ONBOARDING_CHECKLIST[prev.length].id])
    }, 350)
    return () => clearTimeout(t)
  }, [checklistAnimating, checklistDone.length])

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, maxStep))
  }, [maxStep])
  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])
  const triggerChecklist = useCallback(() => {
    if (checklistAnimating) return
    setChecklistDone([])
    setChecklistAnimating(true)
  }, [checklistAnimating])

  /* ── Google OAuth button ── */
  const [googleLoading, setGoogleLoading] = useState(false)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    // Save invitation token before OAuth redirect so AuthCallbackPage can pick it up
    if (inviteToken) {
      localStorage.setItem('pending_invitation_token', inviteToken)
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

  /* ── Submit handler ── */
  const onSubmit = async (data: RegisterForm | InviteForm | OAuthForm) => {
    setError(null)
    setSubmitStatus('loading')
    setLoading(true)

    try {
      let userId: string
      let sessionTokens: { accessToken: string; expiresAt: number }

      if (oauthFlow) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) throw new Error('No hay sesi&oacute;n activa de Google')
        userId = session.user.id
        sessionTokens = {
          accessToken: session.access_token,
          expiresAt: session.expires_at || Date.now() + 3600000,
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: (data as RegisterForm | InviteForm).email,
          password: (data as RegisterForm).password,
          options: {
            emailRedirectTo: window.location.origin + '/auth/callback',
          },
        })

        if (authError) throw new Error(authError.message)

        if (!authData.user || authData.session === null) {
          setSubmitStatus('success')
          setError('Por favor verifica tu correo electr&oacute;nico para continuar.')
          setLoading(false)
          return
        }

        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        })

        userId = authData.user.id
        sessionTokens = {
          accessToken: authData.session.access_token,
          expiresAt: authData.session.expires_at || Date.now() + 3600000,
        }
      }

      if (inviteData) {
        const { data: invitation } = await supabase
          .from('organization_invitations')
          .select('organization_id')
          .eq('invitation_token', inviteToken)
          .single()

        if (!invitation) throw new Error('Invitaci&oacute;n no encontrada')

        await supabase.from('profiles').upsert({ id: userId, full_name: data.fullName })
        await supabase.from('organization_members').insert({
          user_id: userId,
          organization_id: invitation.organization_id,
          role: inviteData.role,
          is_active: true,
        })
        await supabase.from('organization_invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('invitation_token', inviteToken)

        const { data: owners } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', invitation.organization_id)
          .neq('user_id', userId)

        if (owners && owners.length > 0) {
          await supabase.from('notifications').insert(
            owners.map((o) => ({
              user_id: o.user_id,
              organization_id: invitation.organization_id,
              type: 'member_joined',
              title: 'Nuevo miembro',
              message: (data as InviteForm).email + ' se ha unido a la organizaci&oacute;n como ' + (inviteData.role === 'owner' ? 'Propietario' : inviteData.role === 'admin' ? 'Administrador' : 'Miembro') + '.',
              href: '/settings/members',
              metadata: {
                member_email: (data as InviteForm).email,
                member_role: inviteData.role,
                joined_at: new Date().toISOString(),
              },
            }))
          )
        }

        const { data: org } = await supabase.from('organizations').select('*').eq('id', invitation.organization_id).single()

        login(
          { id: userId, email: (data as InviteForm).email, fullName: data.fullName } as User,
          sessionTokens,
          [{ id: org.id, name: org.name, slug: org.slug, plan: org.plan }] as Organization[],
        )

        setSubmitStatus('success')
        setLoading(false)
        sessionStorage.setItem('gestio_joined_org', JSON.stringify({
          name: inviteData.organization_name,
          role: inviteData.role,
        }))
        navigate('/dashboard')
      } else {
        const fullData = data as RegisterForm | OAuthForm
        const slugBase = fullData.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const slug = slugBase + '-' + Date.now()

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: fullData.organizationName, slug })
          .select()
          .single()

        if (orgError) throw new Error('No se pudo crear la organizaci&oacute;n: ' + orgError.message)

        const profileData: any = {
          id: userId,
          full_name: data.fullName,
          organization_id: orgData.id,
        }
        if (oauthData?.avatarUrl) {
          profileData.avatar_url = oauthData.avatarUrl
        }

        await supabase.from('profiles').upsert(profileData)

        await supabase.from('organization_members').insert({
          user_id: userId,
          organization_id: orgData.id,
          role: 'owner',
        })

        login(
          { id: userId, email: (data as RegisterForm).email, fullName: data.fullName, organizationId: orgData.id } as User,
          sessionTokens,
          [{ id: orgData.id, name: orgData.name, slug: orgData.slug, plan: orgData.subscription_plan || 'FREE' }] as Organization[],
        )

        setSubmitStatus('success')
        setLoading(false)
        navigate('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta. Por favor intenta de nuevo.'
      setError(message)
      setSubmitStatus('error')
      setLoading(false)
    }
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Propietario', admin: 'Administrador', member: 'Miembro',
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
              <CardTitle className="text-2xl">&Uacute;nete a {inviteData.organization_name}</CardTitle>
              <CardDescription>
                {inviteData.inviter_name} te invita a unirte como {ROLE_LABELS[inviteData.role] ?? inviteData.role}.
              </CardDescription>
            </>
          ) : oauthFlow ? (
            <>
              <CardTitle className="text-2xl">Complet&aacute; tu registro</CardTitle>
              <CardDescription>
                Tus datos de Google est&aacute;n listos. Solo falta configurar tu organizaci&oacute;n.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>
                Complet&aacute; los pasos para comenzar a usar Gestio
              </CardDescription>
            </>
          )}
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {!inviteData && currentStep < REGULAR_STEPS.length - 1 && (
              <div className="flex items-center justify-center gap-0" role="navigation" aria-label="Progreso del registro">
                {(oauthFlow ? OAUTH_STEPS : REGULAR_STEPS).slice(0, -1).map((s, i) => (
                  <div key={s.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300',
                          i < currentStep && 'bg-green-500 text-white',
                          i === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                          i > currentStep && 'bg-muted text-muted-foreground',
                          i === currentStep && 'animate-[step-glow_2s_ease-in-out_infinite]',
                        )}
                        aria-current={i === currentStep ? 'step' : undefined}
                      >
                        {i < currentStep ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          'mt-1 text-[10px] whitespace-nowrap transition-colors',
                          i === currentStep ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < (oauthFlow ? OAUTH_STEPS : REGULAR_STEPS).length - 2 && (
                      <div
                        className={cn(
                          'mx-1 h-0.5 w-6 sm:w-8 transition-colors duration-300',
                          i < currentStep ? 'bg-green-500' : 'bg-muted',
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && currentStep < maxStep && submitStatus !== 'success' && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {currentStep === 0 && !oauthFlow && (
              <div key="step-0" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input id="fullName" placeholder="Juan P&eacute;rez" {...register('fullName')} />
                  {(errors as FieldErrors<RegisterForm>).fullName && <p className="text-sm text-destructive">{(errors as FieldErrors<RegisterForm>).fullName!.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electr&oacute;nico</Label>
                  <Input id="email" type="email" placeholder="correo@ejemplo.com" readOnly={!!inviteData} {...register('email')} />
                  {(errors as FieldErrors<RegisterForm>).email && <p className="text-sm text-destructive">{(errors as FieldErrors<RegisterForm>).email!.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrase&ntilde;a</Label>
                  <Input id="password" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" data-testid="password" {...register('password')} />
                  {(errors as FieldErrors<RegisterForm>).password && <p className="text-sm text-destructive">{(errors as FieldErrors<RegisterForm>).password!.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contrase&ntilde;a</Label>
                  <Input id="confirmPassword" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" data-testid="confirmPassword" {...register('confirmPassword')} />
                  {(errors as FieldErrors<RegisterForm>).confirmPassword && <p className="text-sm text-destructive">{(errors as FieldErrors<RegisterForm>).confirmPassword!.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 0 && oauthFlow && (
              <div key="step-oauth" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {oauthData ? (
                  <>
                    <div className="rounded-lg border bg-primary/5 p-4 text-center space-y-2">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <GoogleLogo />
                      </div>
                      <p className="text-sm font-medium text-foreground">Conectado como {oauthData.email}</p>
                      <p className="text-xs text-muted-foreground">Tus datos de Google se cargaron autom&aacute;ticamente.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName-oauth">Nombre completo</Label>
                      <Input id="fullName-oauth" placeholder="Tu nombre" defaultValue={oauthData.fullName} {...register('fullName')} />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-oauth">Correo electr&oacute;nico</Label>
                      <Input id="email-oauth" type="email" value={oauthData.email} readOnly className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Verificado con Google &mdash; no necesita confirmaci&oacute;n.</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando datos de Google&hellip;</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && !inviteData && (
              <div key="step-1" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nombre de la organizaci&oacute;n</Label>
                  <Input id="organizationName" placeholder="Mi Empresa" {...register('organizationName')} />
                  {('organizationName' in errors) && (errors as any).organizationName && (
                    <p className="text-sm text-destructive">{(errors as any).organizationName.message}</p>
                  )}
                </div>
                <CompactUploadProgress />
              </div>
            )}

            {currentStep === 2 && !inviteData && (
              <div key="step-2" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-center text-sm text-muted-foreground">Revis&aacute; que todos tus datos sean correctos antes de crear la cuenta.</p>
                <CompactChecklist animating={checklistAnimating} done={checklistDone} />
                {!checklistAnimating && checklistDone.length === 0 && (
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={triggerChecklist}>
                    <Sparkles className="size-3.5" />
                    Verificar pasos
                  </Button>
                )}
                {checklistAnimating && <p className="text-center text-xs text-muted-foreground animate-pulse">Verificando&hellip;</p>}
                {!checklistAnimating && checklistDone.length > 0 && checklistDone.length < ONBOARDING_CHECKLIST.length && (
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={triggerChecklist}>
                    Continuar verificaci&oacute;n
                  </Button>
                )}
                {checklistDone.length === ONBOARDING_CHECKLIST.length && (
                  <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400 animate-in fade-in duration-300">
                    <Check className="size-3.5" />
                    Todo en orden &mdash; pod&eacute;s continuar
                  </div>
                )}
              </div>
            )}

            {currentStep === maxStep && submitStatus !== 'idle' && (
              <div key="step-result" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {submitStatus === 'loading' && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{oauthFlow ? 'Configurando tu organizaci&oacute;n&hellip;' : 'Creando tu cuenta&hellip;'}</p>
                  </div>
                )}
                {submitStatus === 'success' && (
                  <CompactSuccess message={oauthFlow ? 'Organizaci&oacute;n creada con &eacute;xito!' : (error || 'Cuenta creada con &eacute;xito!')} />
                )}
                {submitStatus === 'error' && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                      <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
                      <p className="text-sm font-medium text-destructive">{oauthFlow ? 'Error al crear la organizaci&oacute;n' : 'Error al crear la cuenta'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{error || 'Intenta de nuevo en unos segundos.'}</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setSubmitStatus('idle')
                        setCurrentStep(isInvite ? 0 : oauthFlow ? 1 : 2)
                        setError(null)
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStep < maxStep && (
              <div className="flex w-full gap-2">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" className="flex-1" onClick={goPrev}>
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                )}
                {currentStep === 0 && !inviteData && !oauthFlow && (
                  <Button type="button" className="flex-1" onClick={goNext}>
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                )}
                {currentStep === 0 && oauthFlow && (
                  <Button type="button" className="flex-1" onClick={goNext} disabled={!oauthData}>
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                )}
                {currentStep === 0 && inviteData && (
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear cuenta y aceptar
                  </Button>
                )}
                {currentStep === 1 && !inviteData && (
                  <Button type="button" className="flex-1" onClick={goNext}>
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                )}
                {currentStep === 2 && !inviteData && (
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {oauthFlow ? 'Crear Organizaci&oacute;n' : 'Crear Cuenta'}
                  </Button>
                )}
              </div>
            )}

            {!oauthFlow && currentStep < maxStep && submitStatus === 'idle' && (
              <>
                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border/60" />
                  <span className="text-xs font-medium text-muted-foreground/60">
                    {inviteData ? 'O acept&aacute; la invitaci&oacute;n con' : 'O registrate con'}
                  </span>
                  <span className="h-px flex-1 bg-border/60" />
                </div>
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
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                    disabled
                  >
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
                      <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {oauthFlow ? 'Ya ten&eacute;s cuenta? ' : 'Ya ten&eacute;s cuenta? '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Inici&aacute; sesi&oacute;n
              </Link>
            </p>
          </CardContent>
        </form>

        <style>{`
          @keyframes step-glow {
            0%, 100% { box-shadow: 0 0 4px hsl(var(--primary) / 0.3); }
            50% { box-shadow: 0 0 12px hsl(var(--primary) / 0.5); }
          }
          @keyframes step-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
          }
          @keyframes cs-particle {
            0% { opacity: 1; transform: scale(0); }
            50% { opacity: 1; transform: scale(1.5); }
            100% { opacity: 0; transform: scale(0.5) translateY(-8px); }
          }
        `}</style>
      </Card>
    </div>
  )
}
