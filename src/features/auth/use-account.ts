import { useEffect, useState } from 'react'
import { useAuth } from '../../app/auth/auth-context'
import { parseAccount, type Account } from '../../app/auth/account'

export function useAccount() {
  const { client, state } = useAuth()
  const userId = state.user!.id
  const [lookup, setLookup] = useState<{
    status: 'loading' | 'ready' | 'error'
    account: Account | null
  }>({ status: 'loading', account: null })
  useEffect(() => {
    let active = true
    let request = 0
    async function read() {
      const ticket = ++request
      try {
        const { data, error } = await client.rpc('get_my_account')
        if (error) throw error
        const account = parseAccount(data, userId)
        if (active && ticket === request) setLookup({ status: 'ready', account })
      } catch {
        if (active && ticket === request) setLookup({ status: 'error', account: null })
      }
    }
    void read()
    const interval = window.setInterval(() => void read(), 30000)
    const focus = () => {
      void read()
    }
    window.addEventListener('focus', focus)
    return () => {
      active = false
      request++
      clearInterval(interval)
      window.removeEventListener('focus', focus)
    }
  }, [client, userId])
  return lookup
}
