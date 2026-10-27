import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
function tokens(selector: string) {
  const block = css.slice(css.indexOf(selector)).split('}')[0]!
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]),
  )
}
function luminance(hex: string) {
  let value = hex.replace('#', '')
  if (value.length === 3) value = [...value].map((c) => c + c).join('')
  const rgb = value
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722
}
function ratio(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
const light = tokens(':root {')
const dark = { ...light, ...tokens(":root[data-theme='dark'] {") }
for (const [name, values] of [
  ['light', light],
  ['dark', dark],
] as const) {
  const resolve = (key: string): string => {
    const value = values[key]!
    const ref = /^var\((--[\w-]+)\)$/.exec(value)
    return ref ? resolve(ref[1]!) : value
  }
  test(`${name} input boundaries, error borders and focus exceed 3:1 against control surfaces`, () => {
    for (const surface of ['--surface', '--surface-soft']) {
      for (const boundary of ['--control-border', '--danger', '--accent']) {
        assert.ok(ratio(resolve(boundary), resolve(surface)) >= 3, `${boundary} on ${surface}`)
      }
    }
  })
  test(`${name} validation text exceeds 4.5:1 on its error surface`, () => {
    assert.ok(ratio(resolve('--danger'), resolve('--danger-soft')) >= 4.5)
  })
}
