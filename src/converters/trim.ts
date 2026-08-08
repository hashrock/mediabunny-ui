import type { ConversionSettings, Trim } from '../types'

/**
 * 設定から切り出し区間を求める。区間が入力全体と変わらない場合や
 * 長さを決められない場合は null を返し、呼び出し側で無加工に倒せるようにする。
 */
export function toTrim(settings: ConversionSettings, duration: number | null): Trim | null {
  const start = Math.max(0, settings.startTime ?? 0)
  const end = settings.endTime ?? duration

  if (end === null || end === undefined) return null
  if (end <= start) return null
  if (start === 0 && duration !== null && end >= duration) return null

  return { start, end }
}
