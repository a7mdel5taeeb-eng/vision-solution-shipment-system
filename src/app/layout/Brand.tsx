import { useLocale } from '../../shared/i18n/locale-context'
import { BrandMark } from '../../shared/ui/BrandMark'

export function Brand({ subtitle = 'system.vsolutions.co' }: { subtitle?: string }) {
  const { t } = useLocale()
  return (
    <div className="brand redesign-brand">
      <span className="brand-symbol" aria-hidden="true">
        <BrandMark />
      </span>
      <div>
        <p className="brand-wordmark">{t.appName}</p>
        <p className="brand-company-descriptor">{t.companyDescriptor}</p>
        <p className="brand-subtitle">{subtitle}</p>
      </div>
    </div>
  )
}
