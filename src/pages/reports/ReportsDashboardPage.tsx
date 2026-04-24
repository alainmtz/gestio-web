import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Boxes, DollarSign, Shield, TrendingUp } from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const REPORTS = [
  {
    title: 'Ventas',
    description: 'Reporte de ventas por período, cliente, producto',
    href: '/reports/sales',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    permission: PERMISSIONS.REPORT_SALES,
  },
  {
    title: 'Inventario',
    description: 'Stock actual, movimientos, alertas de stock bajo',
    href: '/reports/inventory',
    icon: Boxes,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    permission: PERMISSIONS.REPORT_INVENTORY,
  },
  {
    title: 'Financiero',
    description: 'Ingresos, egresos, utilidad neta y cuentas por cobrar',
    href: '/reports/financial',
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    permission: PERMISSIONS.REPORT_FINANCIAL,
  },
  {
    title: 'Auditoría',
    description: 'Log de cambios en el sistema',
    href: '/reports/audit',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    permission: PERMISSIONS.AUDIT_VIEW,
  },
]

export function ReportsDashboardPage() {
  const { hasPermission } = usePermissions()
  const visibleReports = REPORTS.filter((r) => hasPermission(r.permission))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Selecciona un reporte para visualizar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleReports.map((report) => (
          <Link key={report.href} to={report.href}>
            <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-2 rounded-lg ${report.bgColor}`}>
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
