import {
  EMPTY_FIELDS,
  normalizeFields,
  validEmail,
  type DemoState,
  type Shipment,
} from '../../features/shipments/model.ts'
import { createSeed } from './seed.ts'

export const DEMO_STORAGE_KEY = 'vs.prototype.v2'
const validDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
function validFields(row: Shipment) {
  try {
    normalizeFields(row)
    return true
  } catch {
    return false
  }
}
export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const state = value as DemoState
  if (
    state.version !== 2 ||
    !Array.isArray(state.users) ||
    !Array.isArray(state.shipments) ||
    !Array.isArray(state.recipients) ||
    !Number.isSafeInteger(state.nextShipmentNumber)
  )
    return false
  if (
    !state.users.length ||
    !state.users.every(
      (user) =>
        user &&
        typeof user.id === 'string' &&
        typeof user.name === 'string' &&
        typeof user.nameAr === 'string' &&
        typeof user.email === 'string' &&
        validEmail(user.email) &&
        ['admin', 'employee'].includes(user.role) &&
        typeof user.active === 'boolean',
    )
  )
    return false
  if (
    !state.users.some((user) => user.role === 'admin' && user.active) ||
    new Set(state.users.map((user) => user.id)).size !== state.users.length
  )
    return false
  if (!state.recipients.every((email) => typeof email === 'string' && validEmail(email)))
    return false
  const validRow = (row: Shipment) =>
    row &&
    /^TR-\d{4,}$/.test(row.id) &&
    validFields(row) &&
    Object.keys(EMPTY_FIELDS).every(
      (key) =>
        (key === 'driverPhone' && row.driverPhone === undefined) ||
        typeof row[key as keyof typeof EMPTY_FIELDS] === 'string',
    ) &&
    validDate(row.startedAt) &&
    state.users.some((user) => user.id === row.createdBy) &&
    ['pending', 'completed'].includes(row.workflow) &&
    (row.completedAt === null || validDate(row.completedAt)) &&
    (row.workflow === 'completed'
      ? !!row.completedAt && Date.parse(row.completedAt) >= Date.parse(row.startedAt)
      : row.completedAt === null) &&
    (row.deletedAt === null || validDate(row.deletedAt)) &&
    Array.isArray(row.history) &&
    row.history.every(
      (entry) =>
        entry &&
        validDate(entry.at) &&
        (!entry.completedAt || validDate(entry.completedAt)) &&
        typeof entry.actorId === 'string' &&
        [
          'created',
          'updated',
          'completed',
          'completionEdited',
          'reopened',
          'deleted',
          'restored',
        ].includes(entry.action) &&
        (!entry.fields ||
          (Array.isArray(entry.fields) && entry.fields.every((field) => field in EMPTY_FIELDS))),
    ) &&
    (!row.ar ||
      (typeof row.ar === 'object' &&
        !Array.isArray(row.ar) &&
        Object.entries(row.ar).every(
          ([key, text]) =>
            key in EMPTY_FIELDS && key !== 'invoiceImage' && typeof text === 'string',
        )))
  return (
    state.shipments.every(validRow) &&
    new Set(state.shipments.map((row) => row.id)).size === state.shipments.length &&
    state.nextShipmentNumber > Math.max(0, ...state.shipments.map((row) => Number(row.id.slice(3))))
  )
}
export function loadDemo(now: number): {
  state: DemoState
  issue: 'corruptData' | 'storageUnavailable' | null
} {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) {
      const state = createSeed(now)
      try {
        persistDemo(state)
        return { state, issue: null }
      } catch {
        return { state, issue: 'storageUnavailable' }
      }
    }
    const parsed: unknown = JSON.parse(raw)
    return isDemoState(parsed)
      ? { state: parsed, issue: null }
      : { state: createSeed(now), issue: 'corruptData' }
  } catch (error) {
    return {
      state: createSeed(now),
      issue: error instanceof SyntaxError ? 'corruptData' : 'storageUnavailable',
    }
  }
}
export function persistDemo(state: DemoState) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}
