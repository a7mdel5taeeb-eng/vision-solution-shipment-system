import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { SupabaseClient, SupportedStorage } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'
import { clearAuthStorage } from './client'
import { AuthSessionStore } from './session-store'
import { clearCommandStorage } from '../../features/connected/command-session'

export function AuthProvider({
  client,
  storage,
  children,
}: {
  client: SupabaseClient
  storage: SupportedStorage
  children: ReactNode
}) {
  const [store] = useState(
    () =>
      new AuthSessionStore(client.auth, async () => {
        try {
          clearCommandStorage(window.sessionStorage)
        } finally {
          await clearAuthStorage(storage)
        }
      }),
  )
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => {
    if (state.status === 'anonymous' || state.operation === 'signout') {
      try {
        clearCommandStorage(window.sessionStorage)
      } catch {
        /* Never expose another session's recovery data. */
      }
    }
  }, [state.status, state.operation])
  useEffect(() => store.start(), [store])
  return <AuthContext.Provider value={{ state, store, client }}>{children}</AuthContext.Provider>
}
