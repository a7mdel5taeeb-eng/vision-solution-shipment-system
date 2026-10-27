import { useLayoutEffect, useState, type ReactNode } from 'react'
import { readPreference, writePreference } from '../lib/preferences'
import { ThemeContext, type Theme } from './theme-context'

const STORAGE_KEY = 'vs.theme.v1'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readPreference(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'system'
  })

  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }
    apply()
    writePreference(STORAGE_KEY, theme)
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
