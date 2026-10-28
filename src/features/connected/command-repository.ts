import type { SupabaseClient } from '@supabase/supabase-js'
import { parseReceipt, type CommandArgs, type CommandReceipt } from './command-model.ts'

export type CommandProblem =
  'conflict' | 'denied' | 'unavailable' | 'validation' | 'idempotency' | 'uncertain' | 'storage'
export class ShipmentCommandError extends Error {
  readonly problem: CommandProblem
  constructor(problem: CommandProblem) {
    super(problem)
    this.problem = problem
  }
}
export interface ShipmentCommandRepository {
  execute(args: CommandArgs, signal: AbortSignal): Promise<CommandReceipt>
}
export function connectedCommandRepository(client: SupabaseClient): ShipmentCommandRepository {
  return {
    async execute(args, signal) {
      let response
      try {
        response = await client.rpc('shipment_command', args).abortSignal(signal).retry(false)
      } catch {
        throw new ShipmentCommandError('uncertain')
      }
      const { data, error, status } = response
      if (error) {
        // PostgREST maps SQLSTATE 40* to HTTP 500. A known CAS rollback is a conflict,
        // not a reason to resubmit with a fresh key or silently replace its revision.
        const problem: CommandProblem =
          error.code === '40001' && error.message === 'shipment_conflict'
            ? 'conflict'
            : error.code === '22023' && error.message === 'idempotency_key_reused'
              ? 'idempotency'
              : status === 401 || status === 403
                ? 'denied'
                : error.code === 'PT404'
                  ? 'unavailable'
                  : error.code?.startsWith('22') || error.code?.startsWith('23')
                    ? 'validation'
                    : 'uncertain'
        throw new ShipmentCommandError(problem)
      }
      try {
        return parseReceipt(data, args)
      } catch {
        throw new ShipmentCommandError('uncertain')
      }
    },
  }
}
