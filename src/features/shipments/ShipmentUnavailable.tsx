import { PackageX } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { ButtonLink } from '../../shared/ui/Primitives'

export function ShipmentUnavailable() {
  const { t } = useLocale()
  return (
    <section className="panel module-panel">
      <div className="module-icon">
        <PackageX size={35} aria-hidden="true" />
      </div>
      <h1>{t.recordUnavailable}</h1>
      <p>{t.shipmentUnavailable}</p>
      <ButtonLink to="/shipments">{t.backToShipments}</ButtonLink>
    </section>
  )
}
