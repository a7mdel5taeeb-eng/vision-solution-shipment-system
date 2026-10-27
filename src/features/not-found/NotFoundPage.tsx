import { ArrowRight, MapPinOff } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { ButtonLink } from '../../shared/ui/Primitives'

export function NotFoundPage() {
  const { t } = useLocale()
  return (
    <section className="panel module-panel">
      <div className="module-icon">
        <MapPinOff size={36} aria-hidden="true" />
      </div>
      <span className="eyebrow">404</span>
      <h1>{t.notFound}</h1>
      <p>{t.notFoundDescription}</p>
      <ButtonLink to="/dashboard">
        {t.backToDashboard}
        <ArrowRight size={16} className="direction-icon" aria-hidden="true" />
      </ButtonLink>
    </section>
  )
}
