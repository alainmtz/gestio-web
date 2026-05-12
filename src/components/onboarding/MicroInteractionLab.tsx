'use client'

import { useState, useEffect, useRef, useId, useCallback } from 'react'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
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

/* ──────────────────────────────────────────────────────────────────────────
   1. Upload Progress
   ────────────────────────────────────────────────────────────────────────── */

function UploadProgress() {
  const id = useId()
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const statusId = `upload-status-${id}`

  const start = useCallback(() => {
    if (running) return
    setProgress(0)
    setRunning(true)
  }, [running])

  useInterval(
    () => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 18 + 2, 100)
        if (next >= 100) {
          setRunning(false)
          return 100
        }
        return next
      })
    },
    running ? 350 : null,
  )

  const reset = () => { setProgress(0); setRunning(false) }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Upload className="size-4 text-muted-foreground" />
        <span>Subiendo foto de perfil…</span>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de subida"
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            progress === 100 ? 'bg-green-500' : 'bg-primary',
            running && progress < 100 && 'animate-pulse',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span id={statusId} aria-live="polite">
          {progress === 0 && 'Esperando…'}
          {progress > 0 && progress < 100 && `Subiendo… ${Math.round(progress)}%`}
          {progress === 100 && '¡Subida completa!'}
        </span>
        <span className="tabular-nums">{Math.round(progress)}%</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={start} disabled={running || progress === 100}>
          {running && <Loader2 className="size-3 animate-spin" />}
          {running ? 'Subiendo…' : 'Iniciar subida'}
        </Button>
        <Button size="sm" variant="outline" onClick={reset} disabled={progress === 0}>
          Reiniciar
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   2. Checklist Completion
   ────────────────────────────────────────────────────────────────────────── */

const CHECKLIST = [
  { id: 'a', label: 'Verificar correo electrónico' },
  { id: 'b', label: 'Completar perfil' },
  { id: 'c', label: 'Configurar organización' },
  { id: 'd', label: 'Primer inicio de sesión' },
]

function ChecklistCompletion() {
  const id = useId()
  const [done, setDone] = useState<string[]>([])
  const [animating, setAnimating] = useState(false)
  const statusId = `checklist-status-${id}`

  const completeAll = () => {
    if (animating) return
    setDone([])
    setAnimating(true)
  }

  // Sequential completion with stagger
  useEffect(() => {
    if (!animating) return
    if (done.length >= CHECKLIST.length) {
      setAnimating(false)
      return
    }
    const t = setTimeout(() => {
      setDone((prev) => [...prev, CHECKLIST[prev.length].id])
    }, 400)
    return () => clearTimeout(t)
  }, [animating, done.length])

  const reset = () => { setDone([]); setAnimating(false) }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground" id={statusId} aria-live="polite">
        {done.length === 0 && `${CHECKLIST.length} pasos pendientes`}
        {done.length > 0 && done.length < CHECKLIST.length && `${done.length} de ${CHECKLIST.length} completados`}
        {done.length === CHECKLIST.length && '¡Todos los pasos completados!'}
      </p>

      <ul className="space-y-1.5">
        {CHECKLIST.map((item, i) => {
          const checked = done.includes(item.id)
          return (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all duration-300',
                checked && 'bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                  checked
                    ? 'border-green-500 bg-green-500 text-white scale-100 opacity-100'
                    : 'border-muted-foreground/30 scale-90 opacity-60',
                  checked && done.length === i + 1 && 'animate-[micro-bounce_0.4s_ease-out]',
                )}
                aria-hidden="true"
              >
                {checked && <Check className="size-3" />}
              </span>
              <span className={cn('transition-colors', checked && 'text-muted-foreground line-through')}>
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={completeAll} disabled={animating || done.length === CHECKLIST.length}>
          {animating ? 'Completando…' : 'Completar todos'}
        </Button>
        <Button size="sm" variant="outline" onClick={reset} disabled={done.length === 0}>
          Reiniciar
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   3. Stepper Transition
   ────────────────────────────────────────────────────────────────────────── */

const STEPS = ['Datos', 'Verificar', 'Pago', 'Listo']

function StepperTransition() {
  const id = useId()
  const [step, setStep] = useState(0)
  const statusId = `stepper-status-${id}`

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="space-y-4">
      {/* Stepper bar */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300',
                  i < step && 'bg-green-500 text-white',
                  i === step && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  i > step && 'bg-muted text-muted-foreground',
                  i === step && 'animate-[micro-glow_2s_ease-in-out_infinite]',
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'mt-1 text-[10px] transition-colors',
                  i === step ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1 self-start mt-3.5 transition-colors duration-300',
                  i < step ? 'bg-green-500' : 'bg-muted',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        key={step}
        className="animate-in fade-in slide-in-from-bottom-2 rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground"
      >
        {step === 0 && 'Completa tus datos personales'}
        {step === 1 && 'Verifica tu identidad'}
        {step === 2 && 'Configura tu método de pago'}
        {step === 3 && '¡Todo listo para empezar!'}
      </div>

      <p id={statusId} className="sr-only" aria-live="assertive">
        Paso actual: {STEPS[step]} ({step + 1} de {STEPS.length})
      </p>

      <div className="flex justify-between">
        <Button size="sm" variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="size-3.5" />
          Anterior
        </Button>
        <Button size="sm" onClick={next} disabled={step === STEPS.length - 1}>
          {step === STEPS.length - 1 ? 'Completado' : 'Siguiente'}
          {step < STEPS.length - 1 && <ChevronRight className="size-3.5" />}
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   4. Success Confirmation
   ────────────────────────────────────────────────────────────────────────── */

function SuccessConfirmation() {
  const id = useId()
  const [show, setShow] = useState(false)
  const statusId = `success-status-${id}`

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex flex-col items-center gap-2 py-4 transition-all duration-500',
          show ? 'opacity-100 scale-100' : 'opacity-60 scale-95',
        )}
      >
        {/* Animated checkmark */}
        <div
          className={cn(
            'relative flex size-14 items-center justify-center rounded-full transition-all duration-500',
            show ? 'bg-green-500 scale-100' : 'bg-muted scale-90',
          )}
        >
          <Check
            className={cn(
              'size-6 transition-all duration-500',
              show ? 'scale-100 text-white' : 'scale-0 text-transparent',
            )}
          />

          {/* Sparkle particles (CSS-only) */}
          {show && (
            <span className="absolute inset-0" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="absolute size-1 rounded-full bg-green-400"
                  style={{
                    top: `${Math.sin((i * 60 * Math.PI) / 180) * 28 + 50}%`,
                    left: `${Math.cos((i * 60 * Math.PI) / 180) * 28 + 50}%`,
                    animation: `micro-particle 0.8s ease-out ${i * 0.08}s forwards`,
                    opacity: 0,
                  }}
                />
              ))}
            </span>
          )}
        </div>

        <p
          className={cn(
            'text-sm font-medium transition-all duration-300',
            show ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {show ? '¡Registro completado con éxito!' : 'Confirmación pendiente'}
        </p>

        {show && (
          <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500">
            Todos los pasos del onboarding se han completado correctamente.
          </p>
        )}
      </div>

      <p id={statusId} className="sr-only" aria-live="polite">
        {show ? 'Éxito: registro completado' : 'Esperando confirmación'}
      </p>

      <Button size="sm" onClick={() => setShow((s) => !s)} className="w-full">
        {show ? (
          <>
            <RotateCcw className="size-3.5" />
            Reiniciar
          </>
        ) : (
          <>
            <Sparkles className="size-3.5" />
            Mostrar éxito
          </>
        )}
      </Button>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   5. Retry / Error State
   ────────────────────────────────────────────────────────────────────────── */

type RetryStatus = 'idle' | 'error' | 'loading' | 'success'

function RetryError() {
  const id = useId()
  const [status, setStatus] = useState<RetryStatus>('idle')
  const [shake, setShake] = useState(false)
  const statusId = `retry-status-${id}`

  const trigger = () => {
    setStatus('loading')
    setTimeout(() => {
      if (Math.random() > 0.4) {
        setStatus('success')
      } else {
        setStatus('error')
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    }, 1500)
  }

  const reset = () => setStatus('idle')

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-300',
          status === 'error' && 'border-destructive/30 bg-destructive/5',
          status === 'success' && 'border-green-500/30 bg-green-500/5',
          shake && 'animate-[micro-shake_0.4s_ease-in-out]',
        )}
      >
        {status === 'idle' && (
          <p className="text-center text-sm text-muted-foreground">Presiona el botón para simular</p>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Procesando…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-1">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm font-medium text-destructive">Error al procesar</p>
            <p className="text-xs text-muted-foreground">Intenta de nuevo en unos segundos.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-500">
              <Check className="size-4 text-white" />
            </div>
            <p className="text-sm font-medium text-green-600">Operación exitosa</p>
          </div>
        )}
      </div>

      <p id={statusId} className="sr-only" aria-live="polite">
        {status === 'idle' && 'Esperando acción'}
        {status === 'loading' && 'Cargando…'}
        {status === 'error' && 'Error: intenta de nuevo'}
        {status === 'success' && 'Operación completada con éxito'}
      </p>

      <div className="flex gap-2">
        {status !== 'loading' && (
          <Button
            size="sm"
            variant={status === 'error' ? 'destructive' : 'default'}
            onClick={trigger}
            className="flex-1"
          >
            {status === 'error' ? (
              <>
                <RotateCcw className="size-3.5" />
                Reintentar
              </>
            ) : (
              'Simular envío'
            )}
          </Button>
        )}
        {(status === 'error' || status === 'success') && (
          <Button size="sm" variant="outline" onClick={reset}>
            Reiniciar
          </Button>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Lab wrapper
   ────────────────────────────────────────────────────────────────────────── */

const LAB_CARDS: Array<{
  id: string
  step: number
  title: string
  note: string
  component: React.ReactNode
}> = [
  {
    id: 'upload',
    step: 1,
    title: 'Progreso de subida',
    note: 'Barra de progreso animada con simulación de velocidad variable. Usa role="progressbar" para accesibilidad.',
    component: <UploadProgress />,
  },
  {
    id: 'checklist',
    step: 2,
    title: 'Lista de verificación',
    note: 'Pasos que se completan secuencialmente con animación escalonada. Ideal para checklist de registro.',
    component: <ChecklistCompletion />,
  },
  {
    id: 'stepper',
    step: 3,
    title: 'Paso a paso',
    note: 'Stepper con indicador de paso activo, conectores y contenido dinámico. Transiciones suaves entre pasos.',
    component: <StepperTransition />,
  },
  {
    id: 'success',
    step: 4,
    title: 'Confirmación de éxito',
    note: 'Check animado con partículas decorativas. Marca la finalización del flujo de onboarding.',
    component: <SuccessConfirmation />,
  },
  {
    id: 'error',
    step: 5,
    title: 'Estado de error / reintento',
    note: 'Simulación de error con vibración, mensaje descriptivo y botón de reintento con feedback visual.',
    component: <RetryError />,
  },
]

function LabCard({ title, note, children, step, index }: {
  title: string
  note: string
  children: React.ReactNode
  step: number
  index: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100)
    return () => clearTimeout(t)
  }, [index])

  return (
    <Card
      className={cn(
        'flex flex-col transition-all duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
            {step}/{LAB_CARDS.length}
          </Badge>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{note}</p>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-3">{children}</CardContent>
    </Card>
  )
}

export function MicroInteractionLab() {
  return (
    <div className="w-full">
      {/* Inline keyframes for particle, shake, bounce, glow */}
      <style>{`
        @keyframes micro-particle {
          0% { opacity: 1; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0.5) translateY(-8px); }
        }
        @keyframes micro-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes micro-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        @keyframes micro-glow {
          0%, 100% { box-shadow: 0 0 4px hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 0 12px hsl(var(--primary) / 0.5); }
        }
        @keyframes micro-fade-in-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Microinteracciones — Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Demostración de estados de progreso y finalización para el flujo de registro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {LAB_CARDS.map((card, i) => (
          <LabCard key={card.id} title={card.title} note={card.note} step={card.step} index={i}>
            {card.component}
          </LabCard>
        ))}
      </div>
    </div>
  )
}
