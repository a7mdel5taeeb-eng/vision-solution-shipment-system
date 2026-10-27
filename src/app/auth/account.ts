export type ActiveAccount = {
  state: 'active'
  user_id: string
  name: string
  name_ar: string | null
  role: 'admin' | 'employee'
  aal: 'aal1' | 'aal2'
  can_operate: boolean
}
export type Account = ActiveAccount | { state: 'inactive' | 'unprovisioned' }

/** Validate the narrow server contract; never infer privileges from user metadata. */
export function parseAccount(value: unknown, verifiedUserId: string): Account {
  if (!value || typeof value !== 'object' || !('state' in value))
    throw new Error('Invalid account response')
  if (value.state === 'inactive' || value.state === 'unprovisioned') return { state: value.state }
  const account = value as Partial<ActiveAccount>
  if (
    account.state !== 'active' ||
    account.user_id !== verifiedUserId ||
    typeof account.name !== 'string' ||
    !account.name.trim() ||
    !(account.name_ar === null || typeof account.name_ar === 'string') ||
    !['admin', 'employee'].includes(account.role ?? '') ||
    !['aal1', 'aal2'].includes(account.aal ?? '') ||
    account.can_operate !== (account.role === 'employee' || account.aal === 'aal2')
  )
    throw new Error('Invalid protected account response')
  return account as ActiveAccount
}
