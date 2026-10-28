import type { Shipment, ShipmentStatus, HistoryAction } from '../shipments/model.ts'

export type ReadShipment = {
  id: string
  number: string
  display_id: string
  revision: string
  owner_id: string
  customer: string
  origin: string
  destination: string
  truck: string
  driver: string
  cargo: string
  driver_phone: string | null
  invoice_number: string | null
  notes: string | null
  started_at: string
  completed_at: string | null
  deleted_at: string | null
  deleted_by: string | null
  updated_at: string
  workflow: 'pending' | 'completed'
  status: ShipmentStatus
  server_now: string
}
export type ReadEvent = {
  id: string
  shipment_id: string
  actor_id: string
  occurred_at: string
  action: HistoryAction
  revision: string
  changed_fields: string[]
  completed_at: string | null
}
export type ReadQuery = {
  search: string
  status: '' | ShipmentStatus
  scope: 'active' | 'deleted'
  sort: 'newest' | 'oldest'
  owner: string | null
  limit: number
  offset: number
}
export type ReadCounts = Record<'total' | ShipmentStatus, string>
export type ReadPage = {
  rows: ReadShipment[]
  total: string
  counts: ReadCounts
  server_now: string
}
export type HistoryPage = { rows: ReadEvent[]; total: string; server_now: string }
export const defaultQuery: ReadQuery = {
  search: '',
  status: '',
  scope: 'active',
  sort: 'newest',
  owner: null,
  limit: 10,
  offset: 0,
}
export const uuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
const decimal = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9]\d*)$/.test(v)
const timestamp = (v: unknown): v is string =>
  typeof v === 'string' && Number.isFinite(Date.parse(v))
const nullable = (v: unknown) => v === null || typeof v === 'string'
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid read response')
  return v as Record<string, unknown>
}
export function parseShipment(value: unknown): ReadShipment {
  const row = object(value)
  if (
    !uuid(row.id) ||
    !uuid(row.owner_id) ||
    !decimal(row.number) ||
    BigInt(row.number) < 1n ||
    !decimal(row.revision) ||
    BigInt(row.revision) < 1n ||
    row.display_id !== `TR-${row.number.padStart(4, '0')}` ||
    !['customer', 'origin', 'destination', 'truck', 'driver', 'cargo'].every(
      (k) => typeof row[k] === 'string',
    ) ||
    !['driver_phone', 'invoice_number', 'notes'].every((k) => nullable(row[k])) ||
    !['started_at', 'updated_at', 'server_now'].every((k) => timestamp(row[k])) ||
    ![row.completed_at, row.deleted_at].every((v) => v === null || timestamp(v)) ||
    !(row.deleted_by === null || uuid(row.deleted_by)) ||
    !['pending', 'completed'].includes(String(row.workflow)) ||
    !['pending', 'completed', 'overdue'].includes(String(row.status)) ||
    (row.workflow === 'completed') !== (row.completed_at !== null)
  )
    throw new Error('Invalid shipment')
  // PostgreSQL has finer timestamp precision than Date. Never recalculate server status here.
  if ((row.workflow === 'completed') !== (row.status === 'completed'))
    throw new Error('Invalid server status')
  return row as ReadShipment
}
export function parseReadPage(value: unknown): ReadPage {
  const page = object(value),
    counts = object(page.counts)
  if (
    !Array.isArray(page.rows) ||
    page.rows.length > 100 ||
    !decimal(page.total) ||
    !timestamp(page.server_now) ||
    !['total', 'pending', 'overdue', 'completed'].every((k) => decimal(counts[k]))
  )
    throw new Error('Invalid page')
  return {
    rows: page.rows.map(parseShipment),
    total: page.total,
    counts: counts as ReadCounts,
    server_now: page.server_now,
  }
}
export function parseHistoryPage(value: unknown, shipmentId: string): HistoryPage {
  const page = object(value)
  if (
    !Array.isArray(page.rows) ||
    page.rows.length > 100 ||
    !decimal(page.total) ||
    !timestamp(page.server_now)
  )
    throw new Error('Invalid history page')
  const rows = page.rows.map((value) => {
    const e = object(value)
    if (
      !uuid(e.id) ||
      e.shipment_id !== shipmentId ||
      !uuid(e.actor_id) ||
      !decimal(e.revision) ||
      !timestamp(e.occurred_at) ||
      !(e.completed_at === null || timestamp(e.completed_at)) ||
      ![
        'created',
        'updated',
        'completed',
        'completionEdited',
        'reopened',
        'deleted',
        'restored',
      ].includes(String(e.action)) ||
      !Array.isArray(e.changed_fields) ||
      !e.changed_fields.every((v) => typeof v === 'string')
    )
      throw new Error('Invalid history event')
    return e as ReadEvent
  })
  return { rows, total: page.total, server_now: page.server_now }
}

/** Presentation only: UUID remains identity; TR is never used as an API identifier. */
export function shipmentPresentation(row: ReadShipment): Shipment {
  return {
    id: row.display_id,
    createdBy: row.owner_id,
    customer: row.customer,
    origin: row.origin,
    destination: row.destination,
    truck: row.truck,
    driver: row.driver,
    cargo: row.cargo,
    driverPhone: row.driver_phone ?? '',
    invoice: row.invoice_number ?? '',
    invoiceImage: '',
    notes: row.notes ?? '',
    startedAt: row.started_at,
    completedAt: row.completed_at,
    deletedAt: row.deleted_at,
    workflow: row.workflow,
    history: [],
  }
}
