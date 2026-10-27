/** Formatting only: this does not verify that a number exists or is reachable. */
function asciiDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)),
  )
}

function phoneParts(value: string) {
  const text = asciiDigits(value.trim())
  const match = /^(.*?)(?:\s*(?:ext\.?|x|#|;ext=)\s*(\d{1,10}))?$/i.exec(text)
  return { number: match?.[1]?.trim() ?? '', extension: match?.[2] }
}

function dialableNumber(number: string) {
  // International notation such as +44 (0)20 omits the optional domestic trunk zero.
  return /^(?:\+|00)/.test(number) ? number.replace(/\(\s*0\s*\)/g, '') : number
}

export function validDriverPhone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 64) return false
  if (!value.trim()) return true
  const { number } = phoneParts(value)
  if (!/^\+?[\d\s().-]+$/.test(number)) return false
  const digits = dialableNumber(number).replace(/\D/g, '').replace(/^00/, '')
  return digits.length >= 7 && digits.length <= 15
}

export function phoneHref(value: string): string | undefined {
  if (!value.trim() || !validDriverPhone(value)) return undefined
  const { number, extension } = phoneParts(value)
  const normalized = dialableNumber(number)
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+')
  return `tel:${normalized}${extension ? `;ext=${extension}` : ''}`
}
