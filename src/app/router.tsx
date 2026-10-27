import { createBrowserRouter } from 'react-router-dom'
import { OverviewPage } from '../features/overview/OverviewPage'
import { RoleSelectionPage } from '../features/entry/RoleSelectionPage'
import { ShipmentsPage } from '../features/shipments/ShipmentsPage'
import { ShipmentFormPage } from '../features/shipments/ShipmentFormPage'
import { ShipmentDetailPage } from '../features/shipments/ShipmentDetailPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { AlertsPage } from '../features/alerts/AlertsPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { DailyReportPage } from '../features/reports/DailyReportPage'
import { UsersPage } from '../features/users/UsersPage'
import { AboutPage } from '../features/about/AboutPage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'
import { AppShell } from './layout/AppShell'
import { ErrorPage } from './ErrorBoundary'
import { AdminPrototypeRoute } from './demo/AdminPrototypeRoute'
import { DemoWorkspaceRoute } from './demo/DemoWorkspaceRoute'

export const router = createBrowserRouter([
  { path: '/', element: <RoleSelectionPage />, errorElement: <ErrorPage /> },
  {
    element: (
      <DemoWorkspaceRoute>
        <AppShell />
      </DemoWorkspaceRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: 'dashboard', element: <OverviewPage /> },
      { path: 'shipments', element: <ShipmentsPage /> },
      { path: 'my-shipments', element: <ShipmentsPage personal /> },
      { path: 'shipments/new', element: <ShipmentFormPage /> },
      { path: 'shipments/:id', element: <ShipmentDetailPage /> },
      { path: 'shipments/:id/edit', element: <ShipmentFormPage /> },
      {
        path: 'deleted-shipments',
        element: (
          <AdminPrototypeRoute>
            <ShipmentsPage deletedOnly />
          </AdminPrototypeRoute>
        ),
      },
      {
        path: 'alerts',
        element: (
          <AdminPrototypeRoute>
            <AlertsPage />
          </AdminPrototypeRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <AdminPrototypeRoute>
            <ReportsPage />
          </AdminPrototypeRoute>
        ),
      },
      {
        path: 'daily-report',
        element: (
          <AdminPrototypeRoute>
            <DailyReportPage />
          </AdminPrototypeRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminPrototypeRoute>
            <UsersPage />
          </AdminPrototypeRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <AdminPrototypeRoute>
            <SettingsPage />
          </AdminPrototypeRoute>
        ),
      },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
