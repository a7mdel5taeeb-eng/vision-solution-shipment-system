import { validDriverPhone } from '../../shared/lib/phone.ts'

export type Role = 'admin' | 'employee'
export type Workflow = 'pending' | 'completed'
export type ShipmentStatus = Workflow | 'overdue'
export type HistoryAction =
  'created' | 'updated' | 'completed' | 'completionEdited' | 'reopened' | 'deleted' | 'restored'

export interface DemoUser {
  id: string
  name: string
  nameAr: string
  email: string
  role: Role
  active: boolean
}

export interface ShipmentFields {
  customer: string
  origin: string
  destination: string
  truck: string
  driver: string
  /** Optional so existing version-2 browser records remain valid without migration. */
  driverPhone?: string
  cargo: string
  invoice: string
  invoiceImage: string
  notes: string
}
export type ShipmentField = keyof ShipmentFields
export interface HistoryEntry {
  action: HistoryAction
  at: string
  actorId: string
  fields?: ShipmentField[]
  completedAt?: string
}
export interface Shipment extends ShipmentFields {
  id: string
  createdBy: string
  startedAt: string
  workflow: Workflow
  completedAt: string | null
  deletedAt: string | null
  history: HistoryEntry[]
  ar?: Partial<Record<ShipmentField, string>>
}
export interface DemoState {
  version: 2
  shipments: Shipment[]
  users: DemoUser[]
  recipients: string[]
  nextShipmentNumber: number
}

export const HOUR = 3_600_000
export const OVERDUE_AFTER = 96 * HOUR
export const REQUIRED_SHIPMENT_FIELDS = [
  'customer',
  'origin',
  'destination',
  'truck',
  'driver',
  'cargo',
] as const
export const SHIPMENT_FIELD_MAX_LENGTH = 200
export const EMPTY_FIELDS: ShipmentFields = {
  customer: '',
  origin: '',
  destination: '',
  truck: '',
  driver: '',
  driverPhone: '',
  cargo: '',
  invoice: '',
  invoiceImage: '',
  notes: '',
}

export function statusOf(shipment: Shipment, now: number): ShipmentStatus {
  if (shipment.workflow === 'completed') return 'completed'
  return now - Date.parse(shipment.startedAt) > OVERDUE_AFTER ? 'overdue' : 'pending'
}
export function overdueHours(shipment: Shipment, now: number) {
  return Math.max(0, Math.floor((now - Date.parse(shipment.startedAt) - OVERDUE_AFTER) / HOUR))
}
export function isLateCompletion(shipment: Shipment) {
  return (
    shipment.workflow === 'completed' &&
    !!shipment.completedAt &&
    Date.parse(shipment.completedAt) - Date.parse(shipment.startedAt) > OVERDUE_AFTER
  )
}
export function canAccess(user: DemoUser, shipment: Shipment) {
  return (
    user.active &&
    (user.role === 'admin' || (shipment.createdBy === user.id && !shipment.deletedAt))
  )
}
export function visibleShipments(state: DemoState, user: DemoUser, includeDeleted = false) {
  return state.shipments.filter((row) => canAccess(user, row) && (includeDeleted || !row.deletedAt))
}
export function shipmentTotals(rows: Shipment[], now: number) {
  const totals = { total: rows.length, pending: 0, completed: 0, overdue: 0 }
  for (const row of rows) totals[statusOf(row, now)]++
  return totals
}
export function displayField(row: Shipment, field: ShipmentField, locale: string) {
  return locale === 'ar' ? (row.ar?.[field] ?? row[field] ?? '') : (row[field] ?? '')
}
export function userName(user: DemoUser | undefined, locale: string) {
  return user ? (locale === 'ar' ? user.nameAr || user.name : user.name) : '—'
}

export type DomainErrorCode =
  | 'accessDenied'
  | 'requiredFields'
  | 'invalidCompletion'
  | 'invalidImage'
  | 'invalidDriverPhone'
  | 'invalidUser'
  | 'invalidEmail'
  | 'selfUserChange'
  | 'recordUnavailable'
export class DomainError extends Error {
  code: DomainErrorCode
  constructor(code: DomainErrorCode) {
    super(code)
    this.code = code
  }
}

export function normalizeFields(input: ShipmentFields): ShipmentFields {
  const driverPhone = input.driverPhone === undefined ? '' : input.driverPhone
  if (!validDriverPhone(driverPhone)) throw new DomainError('invalidDriverPhone')
  // Only editable fields may enter a command; record metadata is server/domain-owned.
  const fields = { ...EMPTY_FIELDS, driverPhone }
  for (const key of Object.keys(EMPTY_FIELDS) as ShipmentField[]) {
    const value = key === 'driverPhone' ? driverPhone : input[key]
    if (typeof value !== 'string') throw new DomainError('requiredFields')
    fields[key] = value.trim()
  }
  if (
    REQUIRED_SHIPMENT_FIELDS.some(
      (key) => !fields[key] || fields[key].length > SHIPMENT_FIELD_MAX_LENGTH,
    )
  )
    throw new DomainError('requiredFields')
  if (fields.notes.length > 2000 || fields.invoice.length > 100)
    throw new DomainError('requiredFields')
  if (
    fields.invoiceImage &&
    (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(fields.invoiceImage) ||
      fields.invoiceImage.length > 1_100_000)
  )
    throw new DomainError('invalidImage')
  return fields
}
export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value)
}

export type DemoCommand =
  | { type: 'create'; fields: ShipmentFields }
  | { type: 'update'; id: string; fields: ShipmentFields }
  | { type: 'complete'; id: string; completedAt: string }
  | { type: 'reopen' | 'delete' | 'restore'; id: string }
  | { type: 'saveUser'; user: DemoUser }
  | { type: 'recipients'; recipients: string[] }

/** Central prototype authorization and validation, independent of UI controls. */
export function applyCommand(
  state: DemoState,
  actorId: string,
  command: DemoCommand,
  now: number,
): DemoState {
  const actor = state.users.find((user) => user.id === actorId && user.active)
  if (!actor) throw new DomainError('accessDenied')
  // UI completion controls use seconds. Matching precision keeps immediate completion valid.
  const at = new Date(Math.floor(now / 1000) * 1000).toISOString()
  if (command.type === 'saveUser') {
    if (actor.role !== 'admin') throw new DomainError('accessDenied')
    const user = {
      ...command.user,
      name: command.user.name.trim(),
      nameAr: command.user.nameAr.trim(),
      email: command.user.email.trim().toLowerCase(),
    }
    if (
      !user.name ||
      user.name.length > 100 ||
      user.nameAr.length > 100 ||
      !['admin', 'employee'].includes(user.role) ||
      !validEmail(user.email) ||
      state.users.some((item) => item.email.toLowerCase() === user.email && item.id !== user.id)
    )
      throw new DomainError('invalidUser')
    if (user.id === actorId && (!user.active || user.role !== 'admin'))
      throw new DomainError('selfUserChange')
    return {
      ...state,
      users: state.users.some((item) => item.id === user.id)
        ? state.users.map((item) => (item.id === user.id ? user : item))
        : [...state.users, user],
    }
  }
  if (command.type === 'recipients') {
    if (actor.role !== 'admin') throw new DomainError('accessDenied')
    const recipients = [...new Set(command.recipients.map((email) => email.trim().toLowerCase()))]
    if (recipients.length > 20 || recipients.some((email) => !validEmail(email)))
      throw new DomainError('invalidEmail')
    return { ...state, recipients }
  }
  if (command.type === 'create') {
    const fields = normalizeFields(command.fields)
    const row: Shipment = {
      ...fields,
      id: `TR-${String(state.nextShipmentNumber).padStart(4, '0')}`,
      createdBy: actorId,
      startedAt: at,
      workflow: 'pending',
      completedAt: null,
      deletedAt: null,
      history: [{ action: 'created', actorId, at }],
    }
    return {
      ...state,
      shipments: [row, ...state.shipments],
      nextShipmentNumber: state.nextShipmentNumber + 1,
    }
  }
  const row = state.shipments.find((item) => item.id === command.id)
  if (!row || !canAccess(actor, row)) throw new DomainError('recordUnavailable')
  if ((command.type === 'delete' || command.type === 'restore') && actor.role !== 'admin')
    throw new DomainError('accessDenied')
  if (row.deletedAt && command.type !== 'restore') throw new DomainError('accessDenied')
  let next = { ...row }
  let entry: HistoryEntry
  switch (command.type) {
    case 'update': {
      const fields = normalizeFields(command.fields)
      const changed = (Object.keys(EMPTY_FIELDS) as ShipmentField[]).filter(
        (key) => (row[key] ?? '') !== (fields[key] ?? ''),
      )
      const ar = { ...row.ar }
      for (const key of changed) delete ar[key]
      next = { ...row, ...fields, ar }
      entry = { action: 'updated', fields: changed, actorId, at }
      break
    }
    case 'complete': {
      const completed = Date.parse(command.completedAt)
      if (!Number.isFinite(completed) || completed < Date.parse(row.startedAt) || completed > now)
        throw new DomainError('invalidCompletion')
      next.workflow = 'completed'
      next.completedAt = new Date(completed).toISOString()
      entry = {
        action: row.workflow === 'completed' ? 'completionEdited' : 'completed',
        at,
        actorId,
        completedAt: next.completedAt,
      }
      break
    }
    case 'reopen':
      if (row.workflow !== 'completed') throw new DomainError('accessDenied')
      next.workflow = 'pending'
      next.completedAt = null
      entry = { action: 'reopened', at, actorId }
      break
    case 'delete':
      next.deletedAt = at
      entry = { action: 'deleted', at, actorId }
      break
    case 'restore':
      if (!row.deletedAt) throw new DomainError('accessDenied')
      next.deletedAt = null
      entry = { action: 'restored', at, actorId }
      break
  }
  next.history = [...row.history, entry]
  return { ...state, shipments: state.shipments.map((item) => (item.id === row.id ? next : item)) }
}
