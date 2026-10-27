import { createContext, useContext } from 'react'
import type { DemoCommand, DemoState, DemoUser } from '../../features/shipments/model'
import type { MessageKey } from '../../shared/i18n/messages'

export interface DemoContextValue {
  state: DemoState
  user: DemoUser
  now: number
  entered: boolean
  enterDemo: (id: string) => boolean
  leaveDemo: () => void
  selectUser: (id: string) => void
  execute: (command: DemoCommand, success: MessageKey) => boolean
  reset: () => boolean
  notify: (message: MessageKey, error?: boolean) => void
  storageIssue: 'corruptData' | 'storageUnavailable' | null
}
export const DemoContext = createContext<DemoContextValue | null>(null)
export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo must be used inside DemoProvider')
  return context
}
