import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { PendingInvitationBanner } from './PendingInvitationBanner'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export function DashboardLayout() {
  useRealtimeNotifications()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header />
        <div className="px-4 md:px-6 pt-4">
          <PendingInvitationBanner />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
