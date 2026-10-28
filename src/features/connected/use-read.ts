import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { ReadResource } from './read-resource'

export function useRead<T>(read: (signal: AbortSignal) => Promise<T>, revision = 0, poll = true) {
  const scoped = useMemo(() => ({ revision, resource: new ReadResource(read) }), [read, revision])
  const resource = scoped.resource
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot)
  useEffect(() => {
    const delay = window.setTimeout(() => void resource.load(), 200)
    const interval = poll ? window.setInterval(() => void resource.load(true), 30000) : undefined
    const focus = () => void resource.load(true)
    if (poll) window.addEventListener('focus', focus)
    return () => {
      clearTimeout(delay)
      clearInterval(interval)
      window.removeEventListener('focus', focus)
      resource.clear()
    }
  }, [resource, poll])
  return { ...state, retry: () => resource.load() }
}
