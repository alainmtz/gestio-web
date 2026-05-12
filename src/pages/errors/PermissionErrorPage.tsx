import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PermissionErrorPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/auth/login', { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold">Error de permisos</h1>
        <p className="mb-6 text-muted-foreground">
          No se pudieron cargar los permisos. Redirigiendo al inicio de sesi&oacute;n en {countdown} segundos...
        </p>
        <Button
          variant="default"
          onClick={() => navigate('/auth/login', { replace: true })}
        >
          Ir al inicio de sesi&oacute;n ahora
        </Button>
      </div>
    </div>
  )
}
