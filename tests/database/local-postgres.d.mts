export const container: string
export function requireLocalDatabase(): Promise<void>
export function quote(value: unknown): string
export function sql(
  statement: string,
  actor?: string,
  options?: {
    aal?: string
    role?: string
    metadata?: Record<string, unknown>
  },
): Promise<string>
export function json<T = unknown>(
  statement: string,
  actor?: string,
  options?: {
    aal?: string
    role?: string
    metadata?: Record<string, unknown>
  },
): Promise<T>
