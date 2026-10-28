import { EMPTY_FIELDS, type ShipmentFields } from '../shipments/model.ts'
import { positiveBigint } from './command-model.ts'
import { DRAFT_STORAGE_KEY, type CommandStorage } from './command-session.ts'

export type FormDraft = {
  userId: string
  id: string | null
  revision: string | null
  fields: ShipmentFields
}
export function readFormDraft(
  storage: CommandStorage,
  userId: string,
  id: string | null,
): FormDraft | null {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as FormDraft
    if (
      d.userId !== userId ||
      d.id !== id ||
      !(d.revision === null || positiveBigint(d.revision)) ||
      !d.fields
    )
      return null
    for (const k of Object.keys(EMPTY_FIELDS) as (keyof ShipmentFields)[]) {
      const v = d.fields[k]
      if (
        typeof v !== 'string' ||
        v.length > (k === 'notes' ? 2000 : k === 'invoice' ? 100 : k === 'driverPhone' ? 64 : 200)
      )
        return null
    }
    if (d.fields.invoiceImage !== '') return null
    return d
  } catch {
    return null
  }
}
export function saveFormDraft(storage: CommandStorage, draft: FormDraft) {
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}
