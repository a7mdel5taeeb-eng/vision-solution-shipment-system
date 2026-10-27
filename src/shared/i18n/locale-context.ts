import { createContext, useContext } from 'react'
import type { Messages } from './messages'

export type Locale = 'en' | 'ar'
export const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
} | null>(null)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}
