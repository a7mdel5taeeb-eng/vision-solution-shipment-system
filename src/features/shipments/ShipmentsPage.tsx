import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { ButtonLink, PageHeading } from '../../shared/ui/Primitives'
import { visibleShipments } from './model'
import { ShipmentList } from './ShipmentList'

export function ShipmentsPage({
  personal = false,
  deletedOnly = false,
}: {
  personal?: boolean
  deletedOnly?: boolean
}) {
  const { t } = useLocale()
  const { state, user } = useDemo()
  const [params] = useSearchParams()
  const rows = visibleShipments(state, user, deletedOnly).filter(
    (row) =>
      (deletedOnly ? !!row.deletedAt : !row.deletedAt) && (!personal || row.createdBy === user.id),
  )
  const status = ['pending', 'completed', 'overdue'].includes(params.get('status') ?? '')
    ? params.get('status')!
    : ''
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow={t.workspace}
        title={
          deletedOnly
            ? t.deletedShipments
            : personal || user.role === 'employee'
              ? t.myShipments
              : t.allShipments
        }
        description={
          deletedOnly
            ? t.deletedDescription
            : personal && user.role === 'admin'
              ? t.myAdminDescription
              : user.role === 'admin'
                ? t.shipmentListDescription
                : t.employeeListDescription
        }
        action={
          !deletedOnly && (
            <ButtonLink
              to="/shipments/new"
              className={user.role === 'employee' ? 'button-registration' : ''}
            >
              <Plus size={17} aria-hidden="true" />
              {user.role === 'employee' ? t.addLoad : t.addShipment}
            </ButtonLink>
          )
        }
      />
      <section
        className={`panel shipment-register ${user.role === 'employee' ? 'personal-register' : ''}`}
      >
        <ShipmentList
          key={`${deletedOnly}-${personal}-${status}`}
          rows={rows}
          cards={user.role === 'employee'}
          personal={personal}
          initialStatus={status}
        />
      </section>
      <p className="scope-note">{t.localTime}</p>
    </div>
  )
}
