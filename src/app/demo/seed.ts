import {
  HOUR,
  type DemoState,
  type DemoUser,
  type Shipment,
} from '../../features/shipments/model.ts'
import { previousDayRange } from '../../shared/lib/dates.ts'

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'admin',
    name: 'Noura Al Salem',
    nameAr: 'نورة السالم',
    email: 'noura@vision-demo.example',
    role: 'admin',
    active: true,
  },
  {
    id: 'employee-1',
    name: 'Omar Al Harbi',
    nameAr: 'عمر الحربي',
    email: 'omar@vision-demo.example',
    role: 'employee',
    active: true,
  },
  {
    id: 'employee-2',
    name: 'Sara Al Nasser',
    nameAr: 'سارة الناصر',
    email: 'sara@vision-demo.example',
    role: 'employee',
    active: true,
  },
  {
    id: 'employee-3',
    name: 'Faisal Al Rashid',
    nameAr: 'فيصل الراشد',
    email: 'faisal@vision-demo.example',
    role: 'employee',
    active: true,
  },
]
const customers = [
  ['Northline Supplies', 'إمدادات المسار الشمالي'],
  ['Oasis Building Materials', 'واحة مواد البناء'],
  ['Horizon Foods', 'أغذية الأفق'],
  ['Dune Industrial', 'الكثبان الصناعية'],
  ['Cedar Retail', 'الأرز للتجزئة'],
  ['Falcon Packaging', 'الصقر للتغليف'],
] as const
const cities = [
  ['Riyadh', 'الرياض'],
  ['Jeddah', 'جدة'],
  ['Dammam', 'الدمام'],
  ['Tabuk', 'تبوك'],
  ['Abha', 'أبها'],
  ['Madinah', 'المدينة المنورة'],
  ['Buraidah', 'بريدة'],
  ['Jubail', 'الجبيل'],
] as const
const drivers = [
  ['Khalid Mansour', 'خالد منصور'],
  ['Adel Hassan', 'عادل حسن'],
  ['Yousef Saleh', 'يوسف صالح'],
  ['Salman Ali', 'سلمان علي'],
  ['Majed Abdullah', 'ماجد عبدالله'],
  ['Hamad Saeed', 'حمد سعيد'],
] as const
const cargo = [
  ['Palletized building materials', 'مواد بناء على منصات'],
  ['Packaged food products', 'منتجات غذائية مغلفة'],
  ['Industrial spare parts', 'قطع غيار صناعية'],
  ['Retail distribution goods', 'بضائع توزيع للتجزئة'],
] as const

export function createSeed(now: number): DemoState {
  const yesterday = previousDayRange(now)
  const shipments: Shipment[] = Array.from({ length: 32 }, (_, i) => {
    const customer = customers[i % customers.length]!
    const origin = cities[i % cities.length]!
    const destination = cities[(i + 3) % cities.length]!
    const driver = drivers[i % drivers.length]!
    const goods = cargo[i % cargo.length]!
    const completed = i % 4 === 0 || i % 7 === 0
    const overdue = !completed && i % 4 === 1
    let start = now - (completed ? 130 + i * 5 : overdue ? 103 + i * 4 : 3 + ((i * 7) % 85)) * HOUR
    let end = completed ? Math.min(start + (i % 2 === 0 ? 110 : 32) * HOUR, now - HOUR) : null
    if (i < 3) {
      start = yesterday.start + (8 + i) * HOUR
      end = completed ? yesterday.start + 19 * HOUR : null
    }
    const startedAt = new Date(start).toISOString()
    const completedAt = end ? new Date(end).toISOString() : null
    const createdBy = `employee-${(i % 3) + 1}`
    return {
      id: `TR-${String(i + 1).padStart(4, '0')}`,
      customer: customer[0],
      origin: origin[0],
      destination: destination[0],
      truck: `KSA-${4821 + (i % 9) * 37}`,
      driver: driver[0],
      // Fictional US 555 numbers reserved for examples; never real driver contacts.
      driverPhone: i % 3 === 0 ? `+1 202-555-01${String(i % 20).padStart(2, '0')}` : '',
      cargo: goods[0],
      invoice: completed ? `INV-DEMO-${2100 + i}` : '',
      invoiceImage: '',
      notes: '',
      createdBy,
      startedAt,
      workflow: completed ? 'completed' : 'pending',
      completedAt,
      deletedAt: null,
      ar: {
        customer: customer[1],
        origin: origin[1],
        destination: destination[1],
        driver: driver[1],
        cargo: goods[1],
      },
      history: [
        { action: 'created', at: startedAt, actorId: createdBy },
        ...(completedAt
          ? [{ action: 'completed' as const, at: completedAt, actorId: createdBy, completedAt }]
          : []),
      ],
    }
  })
  return {
    version: 2,
    shipments,
    users: DEMO_USERS.map((user) => ({ ...user })),
    recipients: ['operations@vision-demo.example', 'dispatch@vision-demo.example'],
    nextShipmentNumber: 33,
  }
}
