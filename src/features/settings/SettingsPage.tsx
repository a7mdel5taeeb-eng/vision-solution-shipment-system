import { Globe2, Monitor, Moon, Sun, Check } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { useTheme, type Theme } from '../../shared/theme/theme-context'
import { PageHeading } from '../../shared/ui/Primitives'
import { PrototypeSettings } from './PrototypeSettings'

export function SettingsPage() {
  const { t, locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()
  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: t.light },
    { value: 'dark', icon: Moon, label: t.dark },
    { value: 'system', icon: Monitor, label: t.system },
  ]
  return (
    <div className="page-stack">
      <PageHeading eyebrow={t.preferences} title={t.settings} description={t.settingsDescription} />
      <div className="settings-stack">
        <section className="panel settings-panel" aria-labelledby="language-heading">
          <div className="settings-heading">
            <Globe2 size={21} aria-hidden="true" />
            <div>
              <h2 id="language-heading">{t.language}</h2>
              <p>{t.languageDescription}</p>
            </div>
          </div>
          <fieldset className="choice-grid language-choices">
            <legend className="sr-only">{t.language}</legend>
            {(
              [
                { value: 'en', label: 'English', direction: 'LTR' },
                { value: 'ar', label: 'العربية', direction: 'RTL' },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`choice-card ${locale === option.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={locale === option.value}
                  onChange={() => setLocale(option.value)}
                />
                <div className="choice-top">
                  <span className="language-sample" lang={option.value}>
                    {option.value === 'en' ? 'Aa' : 'أ ب'}
                  </span>
                  <span className="choice-check">
                    {locale === option.value && <Check size={14} aria-hidden="true" />}
                  </span>
                </div>
                <strong lang={option.value}>{option.label}</strong>
                <span className="choice-detail" dir="ltr">
                  {option.direction}
                </span>
              </label>
            ))}
          </fieldset>
        </section>
        <section className="panel settings-panel" aria-labelledby="appearance-heading">
          <div className="settings-heading">
            <Sun size={21} aria-hidden="true" />
            <div>
              <h2 id="appearance-heading">{t.appearance}</h2>
              <p>{t.themeDescription}</p>
            </div>
          </div>
          <fieldset className="choice-grid">
            <legend className="sr-only">{t.appearance}</legend>
            {themes.map(({ value, icon: Icon, label }) => (
              <label key={value} className={`choice-card ${theme === value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                />
                <div className="choice-top">
                  <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
                  <span className="choice-check">
                    {theme === value && <Check size={14} aria-hidden="true" />}
                  </span>
                </div>
                <strong>{label}</strong>
                <div className={`theme-swatch swatch-${value}`} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </label>
            ))}
          </fieldset>
        </section>
        <PrototypeSettings />
        <p className="scope-note">{t.deviceLocal}</p>
      </div>
    </div>
  )
}
