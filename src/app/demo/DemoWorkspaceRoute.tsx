import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useDemo } from './demo-context'

export function DemoWorkspaceRoute({ children }: { children: ReactNode }) {
  return useDemo().entered ? children : <Navigate to="/" replace />
}
