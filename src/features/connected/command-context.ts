import { createContext, useContext } from 'react'
import type { CommandSession, CommandState } from './command-session'
export const CommandContext = createContext<{
  session: CommandSession
  state: CommandState
} | null>(null)
export function useCommands() {
  const value = useContext(CommandContext)
  if (!value) throw new Error('Connected command scope is required')
  return value
}
