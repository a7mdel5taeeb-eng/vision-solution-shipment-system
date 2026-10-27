import { useLayoutEffect, useState, type ReactNode } from 'react'
import { ar, en } from './messages'
import { readPreference, writePreference } from '../lib/preferences'
import { LocaleContext, type Locale } from './locale-context'

const STORAGE_KEY = 'vs.locale.v1'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    readPreference(STORAGE_KEY) === 'ar' ? 'ar' : 'en',
  )
  const t = locale === 'ar' ? ar : en

  useLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    writePreference(STORAGE_KEY, locale)
    document.title = `${t.appName} | ${t.appDescriptor}`
  }, [locale, t])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  )
}
