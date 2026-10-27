import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useDemo } from './demo-context'

/** UI-only role boundary for the local prototype; not a production security boundary. */
export function AdminPrototypeRoute({ children }: { children: ReactNode }) {
  return useDemo().user.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}
