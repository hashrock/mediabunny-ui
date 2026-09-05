import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { MIN_RANGE, applyTrim, isWholeClip } from './trim'
import {
  reachableTrim,
  trimActionSequence,
  trimTime,
  trimmableDuration,
} from '../test/arbitraries'
import type { Trim } from '../types'

/** 端の計算に 0.1 秒の加減算が入るので、比較には桁落ち分の余裕を持たせる */
const EPSILON = 1e-6

describe('applyTrim', () => {
  test('どんな操作列をたどっても区間は尺の中に収まり、MIN_RANGE 以上の長さを保つ', () => {
    fc.assert(
      fc.property(trimmableDuration, trimActionSequence, (duration, actions) => {
        const trim = reachableTrim(duration, actions)
        expect(trim.start).toBeGreaterThanOrEqual(0)
        expect(trim.end).toBeLessThanOrEqual(duration)
        expect(trim.end - trim.start).toBeGreaterThanOrEqual(MIN_RANGE - EPSILON)
      })
    )
  })

  test('同じ端をつづけて動かしたときは最後の 1 回だけが効く', () => {
    fc.assert(
      fc.property(
        trimmableDuration,
        trimActionSequence,
        trimTime,
        trimTime,
        fc.boolean(),
        (duration, actions, first, last, movesStart) => {
          const edge = (time: number) =>
            movesStart ? ({ type: 'setStart', time } as const) : ({ type: 'setEnd', time } as const)
          const before = reachableTrim(duration, actions)
          expect(applyTrim(applyTrim(before, duration, edge(first)), duration, edge(last))).toEqual(
            applyTrim(before, duration, edge(last))
          )
        }
      )
    )
  })

  test('「全体」はどの状態からでも入力そのものに戻す（吸収的）', () => {
    fc.assert(
      fc.property(trimmableDuration, trimActionSequence, (duration, actions) => {
        const trim = applyTrim(reachableTrim(duration, actions), duration, { type: 'wholeClip' })
        expect(trim).toEqual({ start: 0, end: duration })
        expect(isWholeClip(trim, duration)).toBe(true)
      })
    )
  })

  test('端を 0 と尺いっぱいへ動かすと「全体」と同じ区間になる', () => {
    fc.assert(
      fc.property(trimmableDuration, trimActionSequence, (duration, actions) => {
        const before = reachableTrim(duration, actions)
        const widened = applyTrim(
          applyTrim(before, duration, { type: 'setStart', time: 0 }),
          duration,
          { type: 'setEnd', time: duration }
        )
        expect(widened).toEqual({ start: 0, end: duration })
      })
    )
  })

  test('尺に収まる区間はどれも、両端を動かせばそのとおりに作れる（到達可能性）', () => {
    const ratio = fc.double({ min: 0, max: 1, noNaN: true })
    fc.assert(
      fc.property(trimmableDuration, ratio, ratio, (duration, startRatio, endRatio) => {
        const start = Math.min(startRatio * duration, duration - MIN_RANGE)
        const shortest = start + MIN_RANGE
        // 尺の端で桁落ちして下限が尺を超えた組み合わせは、そもそも作れない区間なので外す
        fc.pre(shortest <= duration)
        const end = Math.min(duration, shortest + endRatio * (duration - shortest))

        const whole = applyTrim({ start: 0, end: 0 }, duration, { type: 'wholeClip' })
        const trimmedIn = applyTrim(whole, duration, { type: 'setStart', time: start })
        expect(applyTrim(trimmedIn, duration, { type: 'setEnd', time: end })).toEqual({ start, end })
      })
    )
  })

  test('ドラッグを進める向きと端の動く向きは一致する（単調性）', () => {
    fc.assert(
      fc.property(
        trimmableDuration,
        trimActionSequence,
        trimTime,
        trimTime,
        fc.boolean(),
        (duration, actions, a, b, movesStart) => {
          const before = reachableTrim(duration, actions)
          const [near, far] = a <= b ? [a, b] : [b, a]
          const move = (time: number) =>
            applyTrim(
              before,
              duration,
              movesStart ? { type: 'setStart', time } : { type: 'setEnd', time }
            )
          const edge = (trim: Trim) => (movesStart ? trim.start : trim.end)
          expect(edge(move(near))).toBeLessThanOrEqual(edge(move(far)))
        }
      )
    )
  })
})
