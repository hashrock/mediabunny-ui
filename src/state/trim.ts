import type { ConversionSettings, Trim } from '../types'

/**
 * 切り出し区間そのもののルール。React にも mediabunny にも依存しない純粋な計算だけを置く。
 */

/** これ以上は詰められない区間の長さ（秒） */
export const MIN_RANGE = 0.1

export type TrimAction =
  | { type: 'setStart'; time: number }
  | { type: 'setEnd'; time: number }
  | { type: 'wholeClip' }

/**
 * 切り出し区間の遷移をまとめた純粋関数。
 * 時刻の出どころ（ハンドルのドラッグ・時刻の直接入力・再生位置の取り込み）ごとに
 * 別々に丸めていると条件がずれるので、丸めはここだけで行う。
 *
 * duration >= MIN_RANGE である限り、どんな操作列を与えても
 * 0 <= start かつ start + MIN_RANGE <= end <= duration を保つ。
 */
export function applyTrim(trim: Trim, duration: number, action: TrimAction): Trim {
  switch (action.type) {
    case 'setStart':
      // 尺より短い動画では区間を詰めきれないので、その場合は 0 側を優先する
      return { start: Math.max(0, Math.min(action.time, trim.end - MIN_RANGE)), end: trim.end }
    case 'setEnd':
      // 同じ理由で、こちらは尺をはみ出さないことを優先する
      return { start: trim.start, end: Math.min(duration, Math.max(action.time, trim.start + MIN_RANGE)) }
    case 'wholeClip':
      return { start: 0, end: duration }
  }
}

/** 区間が入力全体を覆うか。「全体」に戻す操作を出せるかの判断に使う */
export function isWholeClip(trim: Trim, duration: number): boolean {
  return trim.start === 0 && trim.end >= duration
}

/** 切り出す長さ（秒）。潰れた区間は 0 とみなす */
export function trimDuration(trim: Trim): number {
  return Math.max(0, trim.end - trim.start)
}

/** 設定に入っている切り出し区間を読む。終端が設定になければ尺で埋める */
export function trimFromSettings(settings: ConversionSettings, duration: number): Trim {
  return { start: Math.max(0, settings.startTime ?? 0), end: settings.endTime ?? duration }
}

/**
 * 変換に渡す切り出し指定。区間が入力全体と変わらない場合や
 * 長さを決められない場合は null を返し、呼び出し側で無加工に倒せるようにする。
 */
export function toEncodeTrim(settings: ConversionSettings, duration: number | null): Trim | null {
  // 尺が分からないときは、終端を設定から決められなければ長さ 0 に倒れて null になる
  const trim = trimFromSettings(settings, duration ?? 0)
  if (trimDuration(trim) === 0) return null
  return duration !== null && isWholeClip(trim, duration) ? null : trim
}
