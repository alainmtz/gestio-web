import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, User, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

export function ProfilePage() {
  const { user } = useAuthStore()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const { toast } = useToast()

  const handleProfileSave = async () => {
    setIsSavingProfile(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('No user')
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', authUser.id)
      if (error) throw error
      toast({ title: 'Perfil actualizado', description: 'Tu información ha sido guardada.' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el perfil.', variant: 'destructive' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({ title: 'Error', description: 'Debes introducir tu contraseña actual', variant: 'destructive' })
      return
    }
    if (!password || password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.email) {
        throw new Error('No se pudo identificar el usuario autenticado')
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      })

      if (reauthError) {
        toast({ title: 'Error', description: 'La contraseña actual es incorrecta', variant: 'destructive' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar la contraseña', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2"><h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1><p className="text-muted-foreground">Actualiza tu información personal</p></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Información Personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue={user?.email || ''} disabled /></div>
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input placeholder="555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleProfileSave} disabled={isSavingProfile}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Cambiar Contraseña</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contraseña Actual</Label>
            <Input
              type="password"
              placeholder="Introduce tu contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar Contraseña</Label>
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}