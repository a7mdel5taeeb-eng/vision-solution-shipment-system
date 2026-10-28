import type { SupabaseClient } from '@supabase/supabase-js'
import {
  parseReadPage,
  parseShipment,
  parseHistoryPage,
  uuid,
  type ReadQuery,
  type ReadPage,
  type ReadShipment,
  type HistoryPage,
} from './read-model.ts'

export type ReadProblem = 'denied' | 'unavailable' | 'network'
export class ShipmentReadError extends Error {
  readonly problem: ReadProblem
  constructor(problem: ReadProblem) {
    super(problem)
    this.problem = problem
  }
}
/** No mutation interface and no storage/cache shared with Demo or another session. */
export interface ShipmentReadRepository {
  list(query: ReadQuery, signal: AbortSignal): Promise<ReadPage>
  detail(id: string, signal: AbortSignal): Promise<ReadShipment>
  history(id: string, offset: number, signal: AbortSignal): Promise<HistoryPage>
}
export function connectedShipmentRepository(client: SupabaseClient): ShipmentReadRepository {
  async function rpc(name: string, args: Record<string, unknown>, signal: AbortSignal) {
    const { data, error, status } = await client.rpc(name, args).abortSignal(signal)
    if (error)
      throw new ShipmentReadError(
        status === 401 || status === 403 ? 'denied' : status === 404 ? 'unavailable' : 'network',
      )
    return data as unknown
  }
  return {
    async list(q, signal) {
      return parseReadPage(
        await rpc(
          'read_shipment_page',
          {
            p_search: q.search,
            p_status: q.status,
            p_scope: q.scope,
            p_owner: q.owner,
            p_sort: q.sort,
            p_limit: q.limit,
            p_offset: q.offset,
          },
          signal,
        ),
      )
    },
    async detail(id, signal) {
      if (!uuid(id)) throw new ShipmentReadError('unavailable')
      const data = await rpc('get_shipments', { p_id: id, p_limit: 1, p_offset: 0 }, signal)
      if (!Array.isArray(data) || !data.length) throw new ShipmentReadError('unavailable')
      const row = parseShipment(data[0])
      if (row.id !== id) throw new ShipmentReadError('unavailable')
      return row
    },
    async history(id, offset, signal) {
      if (!uuid(id)) throw new ShipmentReadError('unavailable')
      return parseHistoryPage(
        await rpc(
          'read_shipment_history_page',
          {
            p_shipment_id: id,
            p_limit: 20,
            p_offset: offset,
          },
          signal,
        ),
        id,
      )
    },
  }
}
