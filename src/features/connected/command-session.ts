import {
  commandArgs,
  validateCommandArgs,
  type CommandInput,
  type CommandArgs,
  type CommandReceipt,
} from './command-model.ts'
import {
  ShipmentCommandError,
  type CommandProblem,
  type ShipmentCommandRepository,
} from './command-repository.ts'
import type { ShipmentReadRepository } from './repository.ts'

export const COMMAND_STORAGE_KEY = 'vs.connected.pending-command.v1'
export const DRAFT_STORAGE_KEY = 'vs.connected.shipment-draft.v1'
export type CommandStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export function clearCommandStorage(storage: CommandStorage) {
  for (const key of [COMMAND_STORAGE_KEY, DRAFT_STORAGE_KEY]) storage.removeItem(key)
}
export type CommandState = {
  status: 'idle' | 'sending' | 'uncertain' | 'error' | 'saved' | 'refreshError'
  intent: CommandArgs | null
  receipt: CommandReceipt | null
  problem: CommandProblem | null
  version: number
}
/** One session/tab, one outstanding intent. Only this new namespace is persisted, never tokens. */
export class CommandSession {
  private state: CommandState = {
    status: 'idle',
    intent: null,
    receipt: null,
    problem: null,
    version: 0,
  }
  private listeners = new Set<() => void>()
  private controller: AbortController | null = null
  private generation = 0
  private unreadable = false
  private userId: string
  private commands: ShipmentCommandRepository
  private reads: ShipmentReadRepository
  private storage: CommandStorage
  constructor(
    userId: string,
    commands: ShipmentCommandRepository,
    reads: ShipmentReadRepository,
    storage: CommandStorage,
  ) {
    this.userId = userId
    this.commands = commands
    this.reads = reads
    this.storage = storage
    try {
      const raw = storage.getItem(COMMAND_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.userId === userId)
          this.state = {
            ...this.state,
            status: 'uncertain',
            intent: validateCommandArgs(parsed.intent),
            problem: 'uncertain',
          }
        else clearCommandStorage(storage)
      }
      const draft = storage.getItem(DRAFT_STORAGE_KEY)
      if (draft && JSON.parse(draft).userId !== userId) storage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      this.unreadable = true
      this.state = { ...this.state, status: 'error', problem: 'storage' }
    }
  }
  getSnapshot = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  private publish(patch: Partial<CommandState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((fn) => fn())
  }
  dispose = () => {
    this.generation++
    this.controller?.abort()
  }
  dismiss = () => {
    if (!this.unreadable && !this.state.intent && this.state.status !== 'sending')
      this.publish({
        status: 'idle',
        problem: null,
        receipt: null,
        version: this.state.version + 1,
      })
  }
  start = async (input: CommandInput): Promise<CommandReceipt | null> => {
    if (this.unreadable || this.state.status === 'sending' || this.state.intent) return null
    let intent: CommandArgs
    try {
      intent = commandArgs(input, crypto.randomUUID())
    } catch {
      this.publish({ status: 'error', problem: 'validation' })
      return null
    }
    try {
      this.storage.setItem(COMMAND_STORAGE_KEY, JSON.stringify({ userId: this.userId, intent }))
    } catch {
      this.publish({ status: 'error', problem: 'storage' })
      return null
    }
    return this.send(intent, false)
  }
  retry = async () => {
    if (this.state.status === 'sending') return null
    if (this.state.intent) return this.send(this.state.intent, true)
    if (this.state.receipt && this.state.status === 'refreshError')
      return this.refresh(this.state.receipt, ++this.generation)
    return null
  }
  private async send(intent: CommandArgs, wasUncertain: boolean): Promise<CommandReceipt | null> {
    const ticket = ++this.generation
    this.controller?.abort()
    this.controller = new AbortController()
    this.publish({ status: 'sending', intent, receipt: null, problem: null })
    let receipt: CommandReceipt
    try {
      receipt = await this.commands.execute(intent, this.controller.signal)
    } catch (error) {
      if (ticket !== this.generation) return null
      const problem = error instanceof ShipmentCommandError ? error.problem : 'uncertain'
      const uncertain = wasUncertain || problem === 'uncertain'
      if (!uncertain) {
        try {
          this.storage.removeItem(COMMAND_STORAGE_KEY)
        } catch {
          /* Retained key still makes a reload retry safe. */
        }
      }
      this.publish({
        status: uncertain ? 'uncertain' : 'error',
        intent: uncertain ? intent : null,
        problem,
      })
      return null
    }
    if (ticket !== this.generation) return null
    try {
      this.storage.removeItem(COMMAND_STORAGE_KEY)
    } catch {
      /* A retained receipt key never creates a new intent. */
    }
    this.publish({ intent: null, receipt, problem: null, version: this.state.version + 1 })
    return this.refresh(receipt, ticket)
  }
  private async refresh(receipt: CommandReceipt, ticket: number): Promise<CommandReceipt | null> {
    this.controller?.abort()
    this.controller = new AbortController()
    this.publish({ status: 'sending' })
    try {
      // Cached command receipts can be older than the current row. Never use them as row state.
      await this.reads.detail(receipt.shipment_id, this.controller.signal)
      if (ticket !== this.generation) return null
      this.publish({ status: 'saved', version: this.state.version + 1 })
      return receipt
    } catch {
      if (ticket !== this.generation) return null
      this.publish({ status: 'refreshError', version: this.state.version + 1 })
      return receipt
    }
  }
}
