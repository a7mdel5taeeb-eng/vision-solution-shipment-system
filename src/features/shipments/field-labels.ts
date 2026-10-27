import type { MessageKey } from '../../shared/i18n/messages'
import type { ShipmentField } from './model'

export const fieldLabels: Record<ShipmentField, MessageKey> = {
  customer: 'customerName',
  origin: 'loadingLocation',
  destination: 'unloadingLocation',
  truck: 'truckNumber',
  driver: 'driverName',
  driverPhone: 'driverPhone',
  cargo: 'cargoDescription',
  invoice: 'invoiceNumber',
  invoiceImage: 'invoiceImage',
  notes: 'notes',
}
