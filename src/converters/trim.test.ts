import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { toTrim } from './trim'
import { MIN_RANGE } from '../state/trim'
import { reachableTrim, trimActionSequence, trimmableDuration } from '../test/arbitraries'
import type { ConversionSettings } from '../types'

/** toTrim が見るのは時刻だけなので、残りは固定しておく */
const settingsWith = (startTime?: number, endTime?: number): ConversionSettings => ({
  format: 'mp4',
  quality: 80,
  startTime,
  endTime,
})

const anyTime = fc.double({ min: -100, max: 1e5, noNaN: true })

describe('toTrim', () => {
  test('返るのは null か、0 以上で長さのある区間だけ', () => {
    fc.assert(
      fc.property(
        fc.option(anyTime, { nil: undefined }),
        fc.option(anyTime, { nil: undefined }),
        fc.option(trimmableDuration, { nil: null }),
        (startTime, endTime, duration) => {
          const trim = toTrim(settingsWith(startTime, endTime), duration)
          if (trim === null) return
          expect(trim.start).toBeGreaterThanOrEqual(0)
          expect(trim.end).toBeGreaterThan(trim.start)
        }
      )
    )
  })

  test('画面で作れる区間はどれも、そのまま渡すか無加工（null）に倒れる', () => {
    fc.assert(
      fc.property(trimmableDuration, trimActionSequence, (duration, actions) => {
        const edited = reachableTrim(duration, actions)
        const trim = toTrim(settingsWith(edited.start, edited.end), duration)
        if (trim === null) {
          // 無加工に倒れるのは入力全体を指しているときだけ
          expect(edited.start).toBe(0)
          expect(edited.end).toBeGreaterThanOrEqual(duration)
        } else {
          expect(trim).toEqual(edited)
        }
      })
    )
  })

  test('入力全体を指す区間は無加工（null）になる', () => {
    fc.assert(
      fc.property(trimmableDuration, fc.double({ min: 0, max: 100, noNaN: true }), (duration, extra) => {
        expect(toTrim(settingsWith(0, duration + extra), duration)).toBeNull()
        expect(toTrim(settingsWith(), duration)).toBeNull()
      })
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
          expect(toTrim(settingsWith(high, low), duration)).toBeNull()
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
          expect(toTrim(settingsWith(negative, end), duration)).toEqual({ start: 0, end })
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
          expect(toTrim(settingsWith(start, start + length), null)).toEqual({
            start,
            end: start + length,
          })
        }
      )
    )
  })
})
