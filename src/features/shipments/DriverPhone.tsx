import { Phone } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { phoneHref } from '../../shared/lib/phone'

export function DriverPhone({ value }: { value?: string }) {
  const { t } = useLocale()
  const href = value ? phoneHref(value) : undefined
  if (!href) return <span className="phone-empty">{t.noDriverPhone}</span>
  return (
    <a className="driver-phone" dir="ltr" href={href} aria-label={`${t.driverPhone}: ${value}`}>
      <Phone size={12} aria-hidden="true" />
      <bdi>{value}</bdi>
    </a>
  )
}
