import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { MIN_RANGE, applyTrim, isWholeClip, toEncodeTrim, trimFromSettings } from './trim'
import {
  reachableTrim,
  trimActionSequence,
  trimTime,
  trimWithDuration,
  trimmableDuration,
} from '../test/arbitraries'
import type { ConversionSettings, Trim } from '../types'

/** 区間の読み書き以外は結果に効かないので固定しておく */
const settingsWith = (startTime?: number, endTime?: number): ConversionSettings => ({
  format: 'mp4',
  quality: 80,
  startTime,
  endTime,
})

const anyTime = fc.double({ min: -100, max: 1e5, noNaN: true })

/** 画面を経由せずに組み上がりうる設定。時刻の指定漏れも混ぜる */
const anySettings = fc
  .tuple(fc.option(anyTime, { nil: undefined }), fc.option(anyTime, { nil: undefined }))
  .map(([startTime, endTime]) => settingsWith(startTime, endTime))

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

describe('trimFromSettings', () => {
  test('開始時刻は必ず 0 以上に丸められる', () => {
    fc.assert(
      fc.property(anySettings, trimmableDuration, (settings, duration) => {
        expect(trimFromSettings(settings, duration).start).toBeGreaterThanOrEqual(0)
      })
    )
  })

  test('画面で作れる区間は、設定を経由しても値が変わらない（往復）', () => {
    fc.assert(
      fc.property(trimWithDuration, ({ duration, trim }) => {
        expect(trimFromSettings(settingsWith(trim.start, trim.end), duration)).toEqual(trim)
      })
    )
  })
})

describe('toEncodeTrim', () => {
  test('返るのは null か、0 以上で長さのある区間だけ', () => {
    fc.assert(
      fc.property(
        anySettings,
        fc.option(trimmableDuration, { nil: null }),
        (settings, duration) => {
          const trim = toEncodeTrim(settings, duration)
          if (trim === null) return
          expect(trim.start).toBeGreaterThanOrEqual(0)
          expect(trim.end).toBeGreaterThan(trim.start)
        }
      )
    )
  })

  test('画面で作れる区間はどれも、そのまま渡すか無加工（null）に倒れる', () => {
    fc.assert(
      fc.property(trimWithDuration, ({ duration, trim: edited }) => {
        const trim = toEncodeTrim(settingsWith(edited.start, edited.end), duration)
        if (trim === null) {
          // 無加工に倒れるのは入力全体を指しているときだけ
          expect(isWholeClip(edited, duration)).toBe(true)
        } else {
          expect(trim).toEqual(edited)
        }
      })
    )
  })

  test('入力全体を指す区間は無加工（null）になる', () => {
    fc.assert(
      fc.property(
        trimmableDuration,
        fc.double({ min: 0, max: 100, noNaN: true }),
        (duration, extra) => {
          expect(toEncodeTrim(settingsWith(0, duration + extra), duration)).toBeNull()
          expect(toEncodeTrim(settingsWith(), duration)).toBeNull()
        }
      )
    )
  })

  test('潰れた区間や逆転した区間は無加工（null）になる', () => {
    fc.assert(
      fc.property(
        trimmableDuration,
        fc.double({ min: 0, max: 1e5, noNaN: true }),
        fc.double({ min: 0, max: 1e5, noNaN: true }),
        (duration, a, b) => {
          const [low, high] = a <= b ? [a, b] : [b, a]
          expect(toEncodeTrim(settingsWith(high, low), duration)).toBeNull()
        }
      )
    )
  })

  test('負の開始時刻は 0 として扱われる', () => {
    fc.assert(
      fc.property(
        trimmableDuration,
        fc.double({ min: -100, max: 0, noNaN: true }),
        (duration, negative) => {
          // 全体と一致すると null に倒れるので、終端は尺より手前にする
          const end = duration / 2
          expect(toEncodeTrim(settingsWith(negative, end), duration)).toEqual({ start: 0, end })
        }
      )
    )
  })

  test('尺が分からなくても終端が決まっていれば区間を返す', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e5, noNaN: true }),
        fc.double({ min: MIN_RANGE, max: 1e5, noNaN: true }),
        (start, length) => {
          expect(toEncodeTrim(settingsWith(start, start + length), null)).toEqual({
            start,
            end: start + length,
          })
        }
      )
    )
  })
})
