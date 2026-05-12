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
      {/* Background grid pattern + glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        {/* Gradient glow */}
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

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
