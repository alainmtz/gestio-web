import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="text-muted-foreground">
          No tienes permisos para ver esta página. Contacta al administrador si crees que es un error.
        </p>
      </div>
      <Button onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
    </div>
  )
}
