import type { SupabaseClient } from '@supabase/supabase-js'
import { ShipmentReadError } from './repository.ts'
import {
  parseReportPage,
  validReportQuery,
  type ReportQuery,
  type ReportPage,
} from './report-model.ts'

export type ReportRepository = { page(q: ReportQuery, signal: AbortSignal): Promise<ReportPage> }
export function connectedReportRepository(client: SupabaseClient): ReportRepository {
  return {
    async page(q, signal) {
      if (!validReportQuery(q)) throw new ShipmentReadError('unavailable')
      const { data, error, status } = await client
        .rpc('read_operational_report', {
          p_kind: q.kind,
          p_search: q.search,
          p_status: q.status,
          p_owner: q.owner || null,
          p_from: q.from || null,
          p_to: q.to || null,
          p_date_field: q.dateField,
          p_limit: q.limit,
          p_offset: q.offset,
        })
        .abortSignal(signal)
      if (error)
        throw new ShipmentReadError(status === 401 || status === 403 ? 'denied' : 'network')
      return parseReportPage(data, q.kind)
    },
  }
}
