import { lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useLocale } from '../shared/i18n/locale-context'
import { needsConnectedMode } from './auth/config'
import { DemoProvider } from './demo/DemoProvider'
import { router } from './router'

const ConnectedApp = lazy(() => import('./auth/ConnectedApp'))
const connected = needsConnectedMode({
  MODE: import.meta.env.MODE,
  VITE_APP_MODE: import.meta.env.VITE_APP_MODE,
})

export function Application() {
  const { t } = useLocale()
  return connected ? (
    <Suspense
      fallback={
        <div className="auth-main" role="status">
          {t.authChecking}
        </div>
      }
    >
      <ConnectedApp />
    </Suspense>
  ) : (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  )
}
