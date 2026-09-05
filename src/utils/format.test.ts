import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import {
  UNITS,
  formatBytes,
  formatDuration,
  formatTimecode,
  parseTimecode,
  replaceExtension,
} from './format'

/** アプリが扱うバイト数（有限・非負） */
const byteCount = fc.double({ min: 0, max: 1e13, noNaN: true })
/**
 * アプリが扱う秒数。動画の長さなので有限・非負。
 * 一様乱数だけだと「あと少しで分が繰り上がる」値をまず踏めないので、
 * 分境界のすぐ手前（59.97 秒など）を明示的に混ぜる。
 */
const durationSeconds = fc.oneof(
  fc.double({ min: 0, max: 1e6, noNaN: true }),
  fc
    .tuple(fc.nat({ max: 1000 }), fc.double({ min: 0, max: 0.05, noNaN: true }))
    .map(([minutes, epsilon]) => (minutes + 1) * 60 - epsilon)
)

/** `1.23 MB` のような表示を実バイト数に戻す */
function decodeBytes(text: string): number {
  const [value, unit] = text.split(' ')
  return Number(value) * Math.pow(1024, UNITS.indexOf(unit))
}

describe('formatBytes', () => {
  test('常に「数値 + 既知の単位」の形になる', () => {
    fc.assert(
      fc.property(byteCount, (bytes) => {
        const [value, unit] = formatBytes(bytes).split(' ')
        expect(UNITS).toContain(unit)
        expect(Number.isFinite(Number(value))).toBe(true)
      })
    )
  })

  test('1 バイト以上なら表示から元のサイズを 0.5% 以内で復元できる', () => {
    fc.assert(
      fc.property(fc.double({ min: 1, max: 1e13, noNaN: true }), (bytes) => {
        expect(Math.abs(decodeBytes(formatBytes(bytes)) - bytes) / bytes).toBeLessThanOrEqual(0.005)
      })
    )
  })

  test('サイズの大小関係が表示でも保たれる', () => {
    fc.assert(
      fc.property(byteCount, byteCount, (a, b) => {
        const [small, large] = a <= b ? [a, b] : [b, a]
        expect(decodeBytes(formatBytes(small))).toBeLessThanOrEqual(decodeBytes(formatBytes(large)))
      })
    )
  })

  test('0 以下や NaN は 0 B になる', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e13, max: 0, noNaN: true }), (bytes) => {
        expect(formatBytes(bytes)).toBe('0 B')
      })
    )
    expect(formatBytes(NaN)).toBe('0 B')
  })
})

describe('formatDuration', () => {
  test('hh:mm:ss 形式で分と秒は 60 未満になる', () => {
    fc.assert(
      fc.property(durationSeconds, (seconds) => {
        const match = /^(\d{2,}):(\d{2}):(\d{2})$/.exec(formatDuration(seconds))
        expect(match).not.toBeNull()
        expect(Number(match![2])).toBeLessThan(60)
        expect(Number(match![3])).toBeLessThan(60)
      })
    )
  })

  test('各桁を足し戻すと秒数の整数部に一致する', () => {
    fc.assert(
      fc.property(durationSeconds, (seconds) => {
        const [h, m, s] = formatDuration(seconds).split(':').map(Number)
        expect(h * 3600 + m * 60 + s).toBe(Math.floor(seconds))
      })
    )
  })
})

describe('formatTimecode', () => {
  test('mm:ss.s か h:mm:ss.s の形になり、分・秒は 60 未満になる', () => {
    fc.assert(
      fc.property(durationSeconds, (seconds) => {
        const match = /^(?:(\d+):)?(\d{2}):(\d{2}\.\d)$/.exec(formatTimecode(seconds))
        expect(match).not.toBeNull()
        expect(Number(match![2])).toBeLessThan(60)
        expect(Number(match![3])).toBeLessThan(60)
      })
    )
  })

  test('負の秒数は 0 として扱う', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e6, max: 0, noNaN: true }), (seconds) => {
        expect(formatTimecode(seconds)).toBe('00:00.0')
      })
    )
  })
})

describe('parseTimecode', () => {
  test('formatTimecode の出力は必ず解釈でき、0.1 秒の丸め誤差に収まる', () => {
    fc.assert(
      fc.property(durationSeconds, (seconds) => {
        const parsed = parseTimecode(formatTimecode(seconds))
        expect(parsed).not.toBeNull()
        expect(Math.abs(parsed! - seconds)).toBeLessThanOrEqual(0.05 + 1e-9)
      })
    )
  })

  test('どんな文字列でも例外を投げず、null か非負の有限数を返す', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const parsed = parseTimecode(text)
        if (parsed !== null) {
          expect(Number.isFinite(parsed)).toBe(true)
          expect(parsed).toBeGreaterThanOrEqual(0)
        }
      })
    )
  })

  test('コロン区切りの数値列は 60 進数として解釈される', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 99 }),
        fc.nat({ max: 59 }),
        fc.nat({ max: 59 }),
        (h, m, s) => {
          expect(parseTimecode(`${h}:${m}:${s}`)).toBe(h * 3600 + m * 60 + s)
        }
      )
    )
  })
})

describe('replaceExtension', () => {
  test('拡張子つきの名前は、拡張子だけが置き換わる', () => {
    const nameSegment = fc.string({ minLength: 1 }).filter((s) => !s.includes('.'))
    fc.assert(
      fc.property(nameSegment, nameSegment, fc.constantFrom('mp4', 'webm', 'gif'), (stem, oldExt, ext) => {
        expect(replaceExtension(`${stem}.${oldExt}`, ext)).toBe(`${stem}.${ext}`)
      })
    )
  })
})
