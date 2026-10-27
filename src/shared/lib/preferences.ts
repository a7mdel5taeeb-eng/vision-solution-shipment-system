/** Browser preferences only. Never use localStorage for credentials or shipment data. */
export function readPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writePreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* Preferences remain usable in memory. */
  }
}
