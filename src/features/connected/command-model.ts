import type { ShipmentFields, HistoryAction } from '../shipments/model.ts'
import { dateTimeInput, fromRiyadhInput } from '../../shared/lib/dates.ts'
import { uuid } from './read-model.ts'

export type CommandOperation = 'create' | 'update' | 'complete' | 'reopen' | 'delete' | 'restore'
export type CommandFields = Record<
  'customer' | 'origin' | 'destination' | 'truck' | 'driver' | 'cargo',
  string
> &
  Record<'driver_phone' | 'invoice_number' | 'notes', string | null>
export type CommandInput =
  | { operation: 'create'; fields: CommandFields }
  | { operation: 'update'; id: string; revision: string; fields: CommandFields }
  | { operation: 'complete'; id: string; revision: string; completedAt: string }
  | { operation: 'reopen' | 'delete' | 'restore'; id: string; revision: string }
export type CommandArgs = {
  p_operation: CommandOperation
  p_request_id: string
  p_shipment_id: string | null
  p_expected_revision: string | null
  p_fields: Partial<CommandFields>
  p_completed_at: string | null
}
export type CommandReceipt = {
  shipment_id: string
  number: string
  revision: string
  started_at: string
  action: HistoryAction
}
export const positiveBigint = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[1-9]\d{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n

export function fieldsForCommand(fields: ShipmentFields): CommandFields {
  return {
    customer: fields.customer.trim(),
    origin: fields.origin.trim(),
    destination: fields.destination.trim(),
    truck: fields.truck.trim(),
    driver: fields.driver.trim(),
    cargo: fields.cargo.trim(),
    driver_phone: fields.driverPhone?.trim() || null,
    invoice_number: fields.invoice.trim() || null,
    notes: fields.notes.trim() || null,
  }
}
export function commandArgs(input: CommandInput, requestId: string): CommandArgs {
  return validateCommandArgs({
    p_operation: input.operation,
    p_request_id: requestId,
    p_shipment_id: input.operation === 'create' ? null : input.id,
    p_expected_revision: input.operation === 'create' ? null : input.revision,
    p_fields: 'fields' in input ? { ...input.fields } : {},
    p_completed_at: input.operation === 'complete' ? input.completedAt : null,
  })
}
/** Validate persisted intents too. Never allow a browser override of owner/start/number. */
export function validateCommandArgs(value: unknown): CommandArgs {
  const v = value as CommandArgs
  const keys = [
    'p_operation',
    'p_request_id',
    'p_shipment_id',
    'p_expected_revision',
    'p_fields',
    'p_completed_at',
  ]
  if (
    !v ||
    typeof v !== 'object' ||
    Object.keys(v).length !== keys.length ||
    !Object.keys(v).every((k) => keys.includes(k)) ||
    !['create', 'update', 'complete', 'reopen', 'delete', 'restore'].includes(v.p_operation) ||
    !uuid(v.p_request_id) ||
    (v.p_operation === 'create'
      ? v.p_shipment_id !== null || v.p_expected_revision !== null
      : !uuid(v.p_shipment_id) || !positiveBigint(v.p_expected_revision)) ||
    !v.p_fields ||
    typeof v.p_fields !== 'object' ||
    Array.isArray(v.p_fields) ||
    (v.p_operation === 'complete'
      ? typeof v.p_completed_at !== 'string' || !Number.isFinite(Date.parse(v.p_completed_at))
      : v.p_completed_at !== null)
  )
    throw new Error('Invalid command intent')
  const required = ['customer', 'origin', 'destination', 'truck', 'driver', 'cargo']
  const optional = ['driver_phone', 'invoice_number', 'notes']
  const fields = v.p_fields as Record<string, unknown>
  if (v.p_operation === 'create' || v.p_operation === 'update') {
    if (
      Object.keys(fields).length !== 9 ||
      !Object.keys(fields).every((k) => [...required, ...optional].includes(k)) ||
      !required.every(
        (k) =>
          typeof fields[k] === 'string' &&
          (fields[k] as string).trim().length > 0 &&
          (fields[k] as string).length <= 200,
      ) ||
      !optional.every(
        (k) =>
          fields[k] === null ||
          (typeof fields[k] === 'string' &&
            (fields[k] as string).length <=
              (k === 'notes' ? 2000 : k === 'invoice_number' ? 100 : 64)),
      )
    )
      throw new Error('Invalid command fields')
  } else if (Object.keys(fields).length) throw new Error('Unexpected command fields')
  return Object.freeze({ ...v, p_fields: Object.freeze({ ...v.p_fields }) })
}
export function parseReceipt(value: unknown, args: CommandArgs): CommandReceipt {
  const r = value as CommandReceipt
  const action =
    args.p_operation === 'create'
      ? 'created'
      : args.p_operation === 'update'
        ? 'updated'
        : args.p_operation === 'reopen'
          ? 'reopened'
          : args.p_operation === 'delete'
            ? 'deleted'
            : args.p_operation === 'restore'
              ? 'restored'
              : null
  if (
    !r ||
    !uuid(r.shipment_id) ||
    (args.p_shipment_id !== null && r.shipment_id !== args.p_shipment_id) ||
    !positiveBigint(r.number) ||
    !positiveBigint(r.revision) ||
    !Number.isFinite(Date.parse(r.started_at)) ||
    (action ? r.action !== action : !['completed', 'completionEdited'].includes(r.action))
  )
    throw new Error('Invalid command receipt')
  return r
}
/** Local feedback only; PostgreSQL independently validates chronology against its clock. */
export function completionFromInput(value: string, startedAt: string, serverNow: number) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?$/.test(value)) return null
  const converted = fromRiyadhInput(value),
    time = Date.parse(converted)
  if (
    !Number.isFinite(time) ||
    dateTimeInput(time) !== (value.length === 16 ? `${value}:00` : value) ||
    time < Date.parse(startedAt) ||
    time > serverNow
  )
    return null
  return new Date(time).toISOString()
}
