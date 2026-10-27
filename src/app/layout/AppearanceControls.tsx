import { Globe2, Sun } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { useTheme } from '../../shared/theme/theme-context'

export function AppearanceControls() {
  const { t, locale, setLocale } = useLocale()
  const { setTheme } = useTheme()
  return (
    <div className="appearance-controls">
      <button
        type="button"
        className="language-control"
        aria-label={t.switchLanguage}
        onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      >
        <Globe2 size={15} aria-hidden="true" />
        <span lang={locale === 'en' ? 'ar' : 'en'}>{locale === 'en' ? 'عربي' : 'English'}</span>
      </button>
      <button
        type="button"
        className="appearance-control"
        aria-label={t.toggleAppearance}
        title={t.toggleAppearance}
        onClick={() =>
          setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
        }
      >
        <Sun size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
