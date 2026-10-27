import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import {
  AuthConfigurationPage,
  AuthLoginPage,
  AuthWorkspacePage,
  ProtectedAuthRoute,
} from '../../features/auth/AuthPages'
import { AuthProvider } from './AuthProvider'
import { readAuthConfiguration } from './config'
import { createLocalAuthClient } from './client'
import { ErrorPage } from '../ErrorBoundary'

const configuration = readAuthConfiguration(
  {
    MODE: import.meta.env.MODE,
    VITE_APP_MODE: import.meta.env.VITE_APP_MODE,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  window.location.origin,
)

function setup() {
  if (configuration.kind !== 'connected') return null
  try {
    const storage = window.localStorage
    return { storage, client: createLocalAuthClient(configuration.config, storage) }
  } catch {
    return null
  }
}
const connection = setup()
const router = createBrowserRouter([
  { path: '/login', element: <AuthLoginPage />, errorElement: <ErrorPage /> },
  {
    element: <ProtectedAuthRoute />,
    errorElement: <ErrorPage />,
    children: [{ path: '/workspace', element: <AuthWorkspacePage /> }],
  },
  { path: '*', element: <Navigate to="/workspace" replace /> },
])

export default function ConnectedApp() {
  if (!connection) return <AuthConfigurationPage />
  return (
    <AuthProvider client={connection.client} storage={connection.storage}>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
