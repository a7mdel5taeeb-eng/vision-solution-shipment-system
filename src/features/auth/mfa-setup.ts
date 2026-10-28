const friendlyName = 'Vision & Solution local'
export type TotpFactor = { id: string; friendly_name?: string; status: string; factor_type: string }
export type Enrollment = { id: string; secret: string; qr: string }
type SetupApi = {
  listFactors(): Promise<{ data: { all: TotpFactor[] } | null; error: unknown }>
  enroll(options: { factorType: 'totp'; friendlyName: string; issuer: string }): Promise<{
    data: { id: string; totp?: { secret: string; qr_code: string } } | null
    error: unknown
  }>
}
export type SetupResult =
  | { kind: 'cancelled' }
  | { kind: 'existing' | 'unfinished'; factors: TotpFactor[] }
  | { kind: 'enrolled'; enrollment: Enrollment }

/** A user-initiated setup may create one factor, but can never remove a factor. */
export async function prepareTotpSetup(api: SetupApi, active: () => boolean): Promise<SetupResult> {
  if (!active()) return { kind: 'cancelled' }
  const listed = await api.listFactors()
  if (!active()) return { kind: 'cancelled' }
  if (listed.error || !listed.data) throw new Error('Authenticator setup unavailable')
  const factors = listed.data.all.filter((factor) => factor.factor_type === 'totp')
  if (factors.some((factor) => factor.status === 'verified')) return { kind: 'existing', factors }
  if (
    factors.some(
      (factor) => factor.status === 'unverified' && factor.friendly_name === friendlyName,
    )
  )
    return { kind: 'unfinished', factors }
  const result = await api.enroll({
    factorType: 'totp',
    friendlyName,
    issuer: 'Vision & Solution Local',
  })
  if (!active()) return { kind: 'cancelled' }
  if (result.error || !result.data?.totp?.secret || !result.data.totp.qr_code)
    throw new Error('Authenticator setup unavailable')
  return {
    kind: 'enrolled',
    enrollment: {
      id: result.data.id,
      secret: result.data.totp.secret,
      qr: result.data.totp.qr_code,
    },
  }
}

export function normalizeMfaCode(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(
      '٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit),
    ),
  )
}
