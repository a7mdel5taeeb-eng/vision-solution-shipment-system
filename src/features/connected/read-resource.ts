import { ShipmentReadError, type ReadProblem } from './repository.ts'

export type ReadState<T> = {
  status: 'loading' | 'ready' | 'error'
  data: T | null
  problem: ReadProblem | null
}
/** One component/session scope only; cancellation also guards transports ignoring abort. */
export class ReadResource<T> {
  private state: ReadState<T> = { status: 'loading', data: null, problem: null }
  private listeners = new Set<() => void>()
  private controller: AbortController | null = null
  private generation = 0
  private readonly read: (signal: AbortSignal) => Promise<T>
  constructor(read: (signal: AbortSignal) => Promise<T>) {
    this.read = read
  }
  getSnapshot = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  private publish(state: ReadState<T>) {
    this.state = state
    this.listeners.forEach((fn) => fn())
  }
  clear = () => {
    this.generation++
    this.controller?.abort()
    this.publish({ status: 'loading', data: null, problem: null })
  }
  load = async () => {
    this.clear()
    const generation = this.generation
    const controller = new AbortController()
    this.controller = controller
    try {
      const data = await this.read(controller.signal)
      if (generation === this.generation) this.publish({ status: 'ready', data, problem: null })
    } catch (error) {
      if (generation === this.generation)
        this.publish({
          status: 'error',
          data: null,
          problem: error instanceof ShipmentReadError ? error.problem : 'network',
        })
    }
  }
}
