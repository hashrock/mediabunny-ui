import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { END_EPSILON, hasReachedEnd, playbackStart } from './playback'
import { MIN_RANGE } from './trim'
import { trimTime, trimWithDuration } from '../test/arbitraries'

describe('playbackStart', () => {
  test('画面で作れるどの区間でも、再生開始位置は区間の中に収まる', () => {
    fc.assert(
      fc.property(trimWithDuration, trimTime, ({ trim }, time) => {
        const from = playbackStart(time, trim.start, trim.end)
        expect(from).toBeGreaterThanOrEqual(trim.start)
        expect(from).toBeLessThan(trim.end)
      })
    )
  })

  test('区間の中にいるときは動かさない（続きから再生できる）', () => {
    const ratio = fc.double({ min: 0, max: 1, maxExcluded: true, noNaN: true })
    fc.assert(
      fc.property(trimWithDuration, ratio, ({ trim }, r) => {
        const inside = trim.start + r * (trim.end - END_EPSILON - trim.start)
        // 丸めで終わり際ちょうどに着地した組み合わせは「中にいる」と言えないので外す
        fc.pre(!hasReachedEnd(inside, trim.end))
        expect(playbackStart(inside, trim.start, trim.end)).toBe(inside)
      })
    )
  })

  test('同じ位置に 2 回当てても結果は変わらない（冪等性）', () => {
    fc.assert(
      fc.property(trimWithDuration, trimTime, ({ trim }, time) => {
        const once = playbackStart(time, trim.start, trim.end)
        expect(playbackStart(once, trim.start, trim.end)).toBe(once)
      })
    )
  })

  test('区間が決まっていなければ、終わりに達することも頭出しもしない', () => {
    fc.assert(
      fc.property(trimTime, (time) => {
        expect(hasReachedEnd(time, null)).toBe(false)
        expect(playbackStart(time, 0, null)).toBe(time)
      })
    )
  })
})

test('区間の最小の長さは、終わり判定の余裕より大きい', () => {
  // これが崩れると「区間の中」が空になり、再生位置を置ける場所が無くなる
  expect(MIN_RANGE).toBeGreaterThan(END_EPSILON)
})
