import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Mail,
  Package,
  Plus,
  Settings2,
  Trash2,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import type { MessageKey } from '../shared/i18n/messages'
import type { Role } from '../features/shipments/model'

export function getNavigation(role: Role) {
  return (
    role === 'admin'
      ? [
          { path: '/dashboard', label: 'dashboard', icon: LayoutDashboard, group: 'workspace' },
          { path: '/shipments', label: 'allShipments', icon: Package, group: 'workspace' },
          { path: '/alerts', label: 'overdueAlerts', icon: TriangleAlert, group: 'workspace' },
          { path: '/reports', label: 'reports', icon: ChartNoAxesCombined, group: 'manage' },
          { path: '/daily-report', label: 'dailyReport', icon: Mail, group: 'manage' },
          { path: '/users', label: 'userManagement', icon: UsersRound, group: 'manage' },
          { path: '/settings', label: 'settings', icon: Settings2, group: 'manage' },
          { path: '/deleted-shipments', label: 'deletedShipments', icon: Trash2, group: 'manage' },
        ]
      : [
          { path: '/dashboard', label: 'dashboard', icon: LayoutDashboard, group: 'workspace' },
          { path: '/shipments', label: 'myShipments', icon: Package, group: 'workspace' },
          { path: '/shipments/new', label: 'addLoad', icon: Plus, group: 'workspace' },
        ]
  ) satisfies { path: string; label: MessageKey; icon: typeof Package; group: string }[]
}
