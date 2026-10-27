import { displayField, statusOf, userName, type DemoUser, type Shipment } from './model.ts'
export type ShipmentSort = 'newest' | 'oldest' | 'idAscending' | 'customerAscending'
export function queryShipments(
  rows: Shipment[],
  users: DemoUser[],
  query: { search: string; status: string; employee: string; sort: ShipmentSort; locale: string },
  now: number,
) {
  const search = query.search.trim().toLocaleLowerCase(query.locale).normalize('NFKC')
  return rows
    .filter((row) => {
      if (query.status && statusOf(row, now) !== query.status) return false
      if (query.employee && row.createdBy !== query.employee) return false
      if (!search) return true
      const owner = users.find((user) => user.id === row.createdBy)
      const values = [
        row.id,
        row.customer,
        row.origin,
        row.destination,
        row.truck,
        row.driver,
        row.invoice,
        row.cargo,
        ...Object.values(row.ar ?? {}),
        owner?.name ?? '',
        userName(owner, query.locale),
      ]
      return values.join(' ').toLocaleLowerCase(query.locale).normalize('NFKC').includes(search)
    })
    .sort((a, b) =>
      query.sort === 'oldest'
        ? Date.parse(a.startedAt) - Date.parse(b.startedAt)
        : query.sort === 'idAscending'
          ? a.id.localeCompare(b.id, undefined, { numeric: true })
          : query.sort === 'customerAscending'
            ? displayField(a, 'customer', query.locale).localeCompare(
                displayField(b, 'customer', query.locale),
                query.locale,
              )
            : Date.parse(b.startedAt) - Date.parse(a.startedAt) ||
              b.id.localeCompare(a.id, undefined, { numeric: true }),
    )
}
