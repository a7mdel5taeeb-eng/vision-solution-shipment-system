import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'
import { clearAuthStorage } from './client'
import { AuthSessionStore } from './session-store'

export function AuthProvider({
  client,
  storage,
  children,
}: {
  client: SupabaseClient
  storage: SupportedStorage
  children: ReactNode
}) {
  const [store] = useState(() => new AuthSessionStore(client.auth, () => clearAuthStorage(storage)))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => store.start(), [store])
  return <AuthContext.Provider value={{ state, store, client }}>{children}</AuthContext.Provider>
}
