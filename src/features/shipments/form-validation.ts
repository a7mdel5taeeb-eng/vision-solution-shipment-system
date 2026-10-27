import { validDriverPhone } from '../../shared/lib/phone.ts'
import {
  REQUIRED_SHIPMENT_FIELDS,
  SHIPMENT_FIELD_MAX_LENGTH,
  type ShipmentFields,
} from './model.ts'

/** Match visual/tab order, including the optional phone before cargo. */
export const SHIPMENT_FORM_FIELDS = [
  'customer',
  'origin',
  'destination',
  'truck',
  'driver',
  'driverPhone',
  'cargo',
] as const
export type FormField = (typeof SHIPMENT_FORM_FIELDS)[number]
export type FieldError = 'fieldRequired' | 'fieldTooLong' | 'invalidDriverPhone'

/** Presentation feedback only; domain commands remain authoritative. */
export function validateShipmentForm(fields: ShipmentFields) {
  const errors: Partial<Record<FormField, FieldError>> = {}
  for (const key of REQUIRED_SHIPMENT_FIELDS) {
    if (!fields[key].trim()) errors[key] = 'fieldRequired'
    else if (fields[key].trim().length > SHIPMENT_FIELD_MAX_LENGTH) errors[key] = 'fieldTooLong'
  }
  if (!validDriverPhone(fields.driverPhone ?? '')) errors.driverPhone = 'invalidDriverPhone'
  return errors
}
export function firstInvalidField(errors: Partial<Record<FormField, FieldError>>) {
  return SHIPMENT_FORM_FIELDS.find((key) => errors[key])
}
