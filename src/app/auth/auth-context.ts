import { createContext, useContext } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthSessionStore, AuthState } from './session-store'

export const AuthContext = createContext<{
  state: AuthState
  store: AuthSessionStore
  client: SupabaseClient
} | null>(null)
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('Connected Auth provider is required')
  return value
}
