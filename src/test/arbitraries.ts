import fc from 'fast-check'
import { MIN_RANGE, applyTrim } from '../state/trim'
import type { TrimAction } from '../state/trim'
import type { ConversionResult, Trim } from '../types'

/** 呼び出し側が渡す進捗は Math.round(0..1 * 100) なので整数の百分率になる */
export const progressValue = fc.integer({ min: 0, max: 100 })

export const conversionResult: fc.Arbitrary<ConversionResult> = fc.record({
  buffer: fc.nat({ max: 64 }).map((size) => new ArrayBuffer(size)),
  originalSize: fc.nat(),
  convertedSize: fc.nat(),
  filename: fc.string(),
})

export const videoFile: fc.Arbitrary<File> = fc
  .tuple(fc.string({ minLength: 1, maxLength: 8 }), fc.nat({ max: 16 }))
  .map(([name, size]) => new File([new Uint8Array(size)], `${name}.mp4`))

/** タイムラインを出す条件（duration > 0）のうち、区間を詰められる長さのもの */
export const trimmableDuration = fc.double({ min: MIN_RANGE, max: 1e5, noNaN: true })

/**
 * 区間の操作に渡ってくる時刻。ドラッグと再生位置は尺の中に収まるが、
 * 時刻の直接入力は尺を超える値も飛んでくるので、範囲外も混ぜる。
 */
export const trimTime = fc.double({ min: 0, max: 2e5, noNaN: true })

export const trimAction: fc.Arbitrary<TrimAction> = fc.oneof(
  trimTime.map((time) => ({ type: 'setStart', time }) as const),
  trimTime.map((time) => ({ type: 'setEnd', time }) as const),
  fc.constant({ type: 'wholeClip' } as const)
)

export const trimActionSequence = fc.array(trimAction, { maxLength: 20 })

/** 入力全体を選んだ状態から操作列をたどった結果 */
export function reachableTrim(duration: number, actions: TrimAction[]): Trim {
  return actions.reduce<Trim>(
    (trim, action) => applyTrim(trim, duration, action),
    { start: 0, end: duration }
  )
}

/** 画面の操作で実際に作れる区間と、その尺 */
export const trimWithDuration = fc
  .tuple(trimmableDuration, trimActionSequence)
  .map(([duration, actions]) => ({ duration, trim: reachableTrim(duration, actions) }))
