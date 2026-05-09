import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { PendingInvitationBanner } from './PendingInvitationBanner'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { LoadingFallback } from '@/components/shared/LoadingFallback'
import { CacheWarningBanner } from '@/components/shared/CacheWarningBanner'
import { useAuthStore } from '@/stores/authStore'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export function DashboardLayout() {
  useRealtimeNotifications()
  const isSwitchingOrganization = useAuthStore((state) => state.isSwitchingOrganization)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header />
        <div className="px-4 md:px-6 pt-4">
          <PendingInvitationBanner />
        </div>
        {isSwitchingOrganization ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingFallback />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense fallback={<LoadingFallback />}>
              <Outlet />
            </Suspense>
          </main>
        )}
        <CacheWarningBanner />
      </SidebarInset>
    </SidebarProvider>
  )
}
