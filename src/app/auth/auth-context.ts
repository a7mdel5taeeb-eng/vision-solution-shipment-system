import { createContext, useContext } from 'react'
import type { AuthSessionStore, AuthState } from './session-store'

export const AuthContext = createContext<{ state: AuthState; store: AuthSessionStore } | null>(null)
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('Connected Auth provider is required')
  return value
}
