import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { ReadResource } from './read-resource'

export function useRead<T>(read: (signal: AbortSignal) => Promise<T>) {
  const resource = useMemo(() => new ReadResource(read), [read])
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot)
  useEffect(() => {
    const delay = window.setTimeout(() => void resource.load(), 200)
    const poll = window.setInterval(() => void resource.load(), 30000)
    const focus = () => void resource.load()
    window.addEventListener('focus', focus)
    return () => {
      clearTimeout(delay)
      clearInterval(poll)
      window.removeEventListener('focus', focus)
      resource.clear()
    }
  }, [resource])
  return { ...state, retry: resource.load }
}
