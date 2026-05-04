import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Mail, Check, X, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/toast'

export function PendingInvitationBanner() {
  const { toast } = useToast()
  const currentOrgId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  const [accepting, setAccepting] = useState<string | null>(null)

  const { data: pendingMembers, isLoading } = useQuery({
    queryKey: ['pendingInvitations', userId, currentOrgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(name)')
        .eq('user_id', userId)
        .eq('is_active', false)
      return data || []
    },
    enabled: !!userId,
  })

  if (isLoading || !pendingMembers?.length) return null

  return (
    <div className="space-y-2">
      {pendingMembers.map((member) => (
        <div key={member.id} className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Invitación pendiente: {member.organization?.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={!!accepting}
                  onClick={async () => {
                    setAccepting(member.id)
                    const { error } = await supabase
                      .from('organization_members')
                      .update({ is_active: true })
                      .eq('id', member.id)
                    if (error) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' })
                    } else {
                      toast({ title: 'Invitación aceptada', description: `Ahora eres miembro de ${member.organization?.name}` })
                    }
                    setAccepting(null)
                  }}
                >
                  {accepting === member.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!accepting}
                  onClick={async () => {
                    setAccepting(member.id)
                    const { error } = await supabase
                      .from('organization_members')
                      .delete()
                      .eq('id', member.id)
                    if (error) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' })
                    } else {
                      toast({ title: 'Invitación rechazada' })
                    }
                    setAccepting(null)
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
