const ENTRY_KEY = 'vs.demo-entry.v1'

/** A tab-local demo entry preference, never an authentication token. */
export function readDemoEntry(): string | null {
  try {
    return sessionStorage.getItem(ENTRY_KEY)
  } catch {
    return null
  }
}
export function writeDemoEntry(id: string | null) {
  try {
    if (id) sessionStorage.setItem(ENTRY_KEY, id)
    else sessionStorage.removeItem(ENTRY_KEY)
  } catch {
    /* In-memory entry still works. */
  }
}
