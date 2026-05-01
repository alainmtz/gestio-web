import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { Plus, CheckCircle2, Clock, AlertCircle, Loader2, Filter, Edit2, Trash2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to?: string
  team_id?: string
  created_by?: string
  created_at: string
}

interface TeamMember {
  id: string
  user_id: string
  name: string
  team_id?: string
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completada',
}

export function TeamsTasksPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const { hasPermission } = usePermissions()

  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('none')

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['teamTasks', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      return (data || []) as Task[]
    },
    enabled: !!organizationId,
  })

  const { data: members } = useQuery({
    queryKey: ['teamMembers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('id, user_id, user:profiles(full_name)')
        .eq('organization_id', organizationId)
      return (data || []).map((m: any) => ({ id: m.id, user_id: m.user_id, name: m.user?.full_name || 'Sin nombre' })) as TeamMember[]
    },
    enabled: !!organizationId,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
      return data || []
    },
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('team_tasks')
        .insert({
          organization_id: organizationId,
          title,
          description: description || null,
          priority,
          status,
          due_date: dueDate || null,
          assigned_to: assignedTo === 'none' ? null : assignedTo,
          created_by: userId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] })
      toast({ title: 'Tarea creada', description: title })
      resetForm()
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTask) return
      const { data, error } = await supabase
        .from('team_tasks')
        .update({ title, description: description || null, priority, status, due_date: dueDate || null, assigned_to: assignedTo === 'none' ? null : assignedTo })
        .eq('id', editingTask.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] })
      toast({ title: 'Tarea actualizada', description: title })
      resetForm()
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('team_tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] })
      toast({ title: 'Tarea eliminada' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const resetForm = () => {
    setShowDialog(false)
    setEditingTask(null)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus('pending')
    setDueDate('')
    setAssignedTo('')
  }

  const openCreate = () => { resetForm(); setShowDialog(true) }
  const openEdit = (task: Task) => {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setStatus(task.status)
    setDueDate(task.due_date || '')
    setAssignedTo(task.assigned_to || '')
    setShowDialog(true)
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    if (editingTask) updateMutation.mutate()
    else createMutation.mutate()
  }

  const filtered = (tasks || []).filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (assigneeFilter && assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) return false
    return true
  })

  const pendingCount = (tasks || []).filter(t => t.status === 'pending').length
  const inProgressCount = (tasks || []).filter(t => t.status === 'in_progress').length
  const completedCount = (tasks || []).filter(t => t.status === 'completed').length

  const memberName = (memberId: string) => members?.find(m => m.id === memberId)?.name || 'Sin asignar'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tareas de Equipos</h1>
          <p className="text-sm text-muted-foreground">Gestiona las tareas asignadas a los miembros del equipo</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nueva Tarea</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{(tasks || []).length}</div><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-2xl font-bold text-muted-foreground">{pendingCount}</div><p className="text-sm text-muted-foreground">Pendientes</p></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-2xl font-bold text-blue-600">{inProgressCount}</div><p className="text-sm text-muted-foreground">En curso</p></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-2xl font-bold text-green-600">{completedCount}</div><p className="text-sm text-muted-foreground">Completadas</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="in_progress">En curso</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Asignado a" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {members?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay tareas</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const StatusIcon = STATUS_ICONS[task.status] || Clock
            return (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusIcon className={`h-5 w-5 shrink-0 ${task.status === 'completed' ? 'text-green-500' : task.status === 'in_progress' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Badge className={PRIORITY_COLORS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                  <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                  {task.due_date && (
                    <Badge variant="outline" className="text-xs">{new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</Badge>
                  )}
                  {task.assigned_to && (
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{memberName(task.assigned_to)}</span>
                  )}
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={v => { if (!v) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la tarea" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles de la tarea" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={v => setPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={v => setStatus(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En curso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Asignar a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {members?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !title.trim()}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
