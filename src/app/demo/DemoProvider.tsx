import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { applyCommand, DomainError, type DemoCommand } from '../../features/shipments/model'
import { readPreference, writePreference } from '../../shared/lib/preferences'
import { useLocale } from '../../shared/i18n/locale-context'
import type { MessageKey } from '../../shared/i18n/messages'
import { DemoContext } from './demo-context'
import { loadDemo, persistDemo } from './repository'
import { createSeed } from './seed'
import { readDemoEntry, writeDemoEntry } from './demo-session'

export function DemoProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  const [initial] = useState(() => loadDemo(Date.now()))
  const [state, setState] = useState(initial.state)
  const latest = useRef(state)
  const [storageIssue, setStorageIssue] = useState(initial.issue)
  const [selected, setSelected] = useState(() => readPreference('vs.demo-user.v2') || 'admin')
  const [enteredId, setEnteredId] = useState(readDemoEntry)
  const [now, setNow] = useState(Date.now)
  const [toast, setToast] = useState<{
    message: MessageKey
    error: boolean
    serial: number
  } | null>(null)
  const serial = useRef(0)
  const user =
    state.users.find((item) => item.id === selected && item.active) ??
    state.users.find((item) => item.active && item.role === 'admin')!

  function notify(message: MessageKey, error = false) {
    setToast({ message, error, serial: ++serial.current })
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    const refresh = () => setNow(Date.now())
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [initial])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.error ? 12_000 : 5_000)
    return () => clearTimeout(timer)
  }, [toast])

  function selectUser(id: string) {
    if (state.users.some((item) => item.id === id && item.active)) {
      setSelected(id)
      writePreference('vs.demo-user.v2', id)
    }
  }
  function enterDemo(id: string) {
    if (!state.users.some((item) => item.id === id && item.active)) return false
    selectUser(id)
    setEnteredId(id)
    writeDemoEntry(id)
    return true
  }
  function leaveDemo() {
    setEnteredId(null)
    writeDemoEntry(null)
    setToast(null)
  }
  function execute(command: DemoCommand, success: MessageKey) {
    if (storageIssue === 'corruptData') {
      notify('corruptData', true)
      return false
    }
    try {
      const next = applyCommand(latest.current, user.id, command, Date.now())
      try {
        persistDemo(next)
      } catch {
        notify('storageError', true)
        return false
      }
      latest.current = next
      setState(next)
      setNow(Date.now())
      setStorageIssue(null)
      notify(success)
      return true
    } catch (error) {
      notify(error instanceof DomainError ? error.code : 'storageError', true)
      return false
    }
  }
  function reset() {
    if (user.role !== 'admin') {
      notify('accessDenied', true)
      return false
    }
    const next = createSeed(Date.now())
    try {
      persistDemo(next)
    } catch {
      notify('storageError', true)
      return false
    }
    latest.current = next
    setState(next)
    setSelected('admin')
    setEnteredId('admin')
    writeDemoEntry('admin')
    writePreference('vs.demo-user.v2', 'admin')
    setStorageIssue(null)
    setNow(Date.now())
    notify('resetSuccess')
    return true
  }
  return (
    <DemoContext.Provider
      value={{
        state,
        user,
        now,
        entered: enteredId === user.id,
        enterDemo,
        leaveDemo,
        selectUser,
        execute,
        reset,
        notify,
        storageIssue,
      }}
    >
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={`toast ${toast.error ? 'toast-error' : ''}`}
            role={toast.error ? 'alert' : 'status'}
          >
            {toast.error ? (
              <TriangleAlert size={19} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={19} aria-hidden="true" />
            )}
            <span>{t[toast.message]}</span>
            <button aria-label={t.dismiss} onClick={() => setToast(null)}>
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </DemoContext.Provider>
  )
}
