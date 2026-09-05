/**
 * 区間の終わりの判定を少し手前で行うための余裕（秒）。
 * 再生位置の更新は飛び飛びに届くので、ちょうどの比較では終わりを踏まずに抜けてしまう。
 *
 * 呼び出す側は end - start > END_EPSILON の区間を渡すこと。
 * applyTrim は尺が MIN_RANGE 以上ならこれを満たす区間しか作らない。
 */
export const END_EPSILON = 0.02

/** 再生位置が区間の終わりに達したか。終わりが決まっていなければ達しようがない */
export function hasReachedEnd(time: number, end: number | null): boolean {
  return end !== null && time >= end - END_EPSILON
}

/**
 * その位置から再生を始めてよいか判断し、区間の外にいたら区間の頭を返す。
 * 区間の中にいるときはその位置のままなので、続きから再生できる。
 */
export function playbackStart(time: number, start: number, end: number | null): number {
  return time < start || hasReachedEnd(time, end) ? start : time
}
