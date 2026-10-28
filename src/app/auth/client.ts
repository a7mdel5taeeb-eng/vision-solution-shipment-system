import { createClient, type SupportedStorage } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, publicClientKey, validLocalApi, type LocalAuthConfig } from './config.ts'

export function clearAuthStorage(storage: SupportedStorage) {
  return Promise.all(
    [AUTH_STORAGE_KEY, `${AUTH_STORAGE_KEY}-code-verifier`, `${AUTH_STORAGE_KEY}-user`].map((key) =>
      storage.removeItem(key),
    ),
  )
}

export function createLocalAuthClient(
  config: LocalAuthConfig,
  storage: SupportedStorage,
  transport: typeof fetch = fetch,
) {
  if (!validLocalApi(config.url) || !publicClientKey(config.publicKey))
    throw new Error('Invalid local Auth configuration')
  return createClient(config.url, config.publicKey, {
    auth: {
      storage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => {
        const url = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        )
        const method = (
          init?.method ?? (input instanceof Request ? input.method : 'GET')
        ).toUpperCase()
        const readLookup =
          method === 'POST' &&
          !url.search &&
          [
            '/rest/v1/rpc/get_my_account',
            '/rest/v1/rpc/read_shipment_page',
            '/rest/v1/rpc/get_shipments',
            '/rest/v1/rpc/read_shipment_history_page',
            '/rest/v1/rpc/shipment_command',
          ].includes(url.pathname)
        // Explicit read/transactional command RPCs only. Raw writes/storage/arbitrary RPCs stay blocked.
        if (
          url.origin !== new URL(config.url).origin ||
          (!url.pathname.startsWith('/auth/v1/') && !readLookup)
        ) {
          return Promise.reject(
            new Error('Only local Auth and authorized shipment APIs are enabled'),
          )
        }
        const timeout = AbortSignal.timeout(10000)
        return transport(input, {
          ...init,
          redirect: 'error',
          signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
        })
      },
    },
  })
}
