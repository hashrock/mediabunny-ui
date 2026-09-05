import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { batchReducer, initialBatchState } from './batchConversion'
import type { BatchAction, BatchState } from './batchConversion'
import { progressValue, videoFile } from '../test/arbitraries'

const fileList = fc.array(videoFile, { minLength: 1, maxLength: 5 })

/** 特定の 1 件に向けた操作。ファイル一覧そのものは動かさない */
type IndexedAction = Extract<BatchAction, { index: number }>

const actionAt = (index: number): fc.Arbitrary<IndexedAction> =>
  fc.oneof(
    fc.constant({ type: 'start', index } as const),
    progressValue.map((value) => ({ type: 'progress', index, value }) as const),
    fc.nat().map((convertedSize) => ({ type: 'complete', index, convertedSize }) as const),
    fc.string().map((message) => ({ type: 'fail', index, message }) as const)
  )

/**
 * 一覧の長さ（最大 5 件）の外側も混ぜる。変換中にファイルを選び直すと起こりうる。
 * 添字の幅を件数に近づけて、同じ件に何度も操作が当たる列が出るようにする。
 */
const itemIndex = fc.integer({ min: -1, max: 5 })

const indexedAction = itemIndex.chain(actionAt)

// 短い列に偏らせると、同じ件で決着が二度起きるような並びを踏めない
const indexedSequence = fc.array(indexedAction, { minLength: 8, maxLength: 24 })

/**
 * 一覧の操作も混ぜた列。選び直しと取り消しを等確率で混ぜると状態が育つ前に流れてしまうので、
 * 1 件ずつの操作が積み上がるように重みを付ける。
 */
const anyAction: fc.Arbitrary<BatchAction> = fc.oneof(
  { arbitrary: indexedAction, weight: 8 },
  { arbitrary: fileList.map((files) => ({ type: 'init', files }) as const), weight: 1 },
  { arbitrary: fc.constant({ type: 'clear' } as const), weight: 1 }
)

const anyActionSequence = fc.array(anyAction, { minLength: 8, maxLength: 30 })

const reachable = (state: BatchState, actions: BatchAction[]): BatchState =>
  actions.reduce(batchReducer, state)

const initial = (files: File[]) => batchReducer(initialBatchState, { type: 'init', files })

describe('batchReducer', () => {
  test('選び直し以外の操作では件数が変わらない', () => {
    fc.assert(
      fc.property(fileList, indexedSequence, (files, actions) => {
        expect(reachable(initial(files), actions)).toHaveLength(files.length)
      })
    )
  })

  test('1 件に向けた操作は他の件に触れない（局所性）', () => {
    fc.assert(
      fc.property(fileList, indexedSequence, indexedAction, (files, actions, action) => {
        const before = reachable(initial(files), actions)
        const after = batchReducer(before, action)
        before.forEach((item, i) => {
          if (i !== action.index) expect(after[i]).toBe(item)
        })
      })
    )
  })

  test('範囲外の添字を指した操作は状態をそのまま返す', () => {
    fc.assert(
      fc.property(
        fileList.chain((files) =>
          fc.tuple(
            fc.constant(files),
            fc
              .oneof(
                fc.integer({ min: -5, max: -1 }),
                fc.integer({ min: files.length, max: files.length + 5 })
              )
              .chain(actionAt)
          )
        ),
        indexedSequence,
        ([files, action], actions) => {
          const before = reachable(initial(files), actions)
          expect(batchReducer(before, action)).toBe(before)
        }
      )
    )
  })

  test('別々の件に向けた操作は順番を入れ替えても同じ結果になる（順序非依存性）', () => {
    fc.assert(
      fc.property(
        fc.array(videoFile, { minLength: 2, maxLength: 5 }).chain((files) =>
          fc.tuple(
            fc.constant(files),
            fc
              .uniqueArray(fc.integer({ min: 0, max: files.length - 1 }), {
                minLength: 2,
                maxLength: 2,
              })
              .chain(([i, j]) => fc.tuple(actionAt(i), actionAt(j)))
          )
        ),
        indexedSequence,
        ([files, [a, b]], actions) => {
          const before = reachable(initial(files), actions)
          expect(reachable(before, [a, b])).toEqual(reachable(before, [b, a]))
        }
      )
    )
  })

  test('選び直し以外の操作でファイルそのものは差し替わらない', () => {
    fc.assert(
      fc.property(fileList, indexedSequence, (files, actions) => {
        reachable(initial(files), actions).forEach((item, i) => {
          expect(item.file).toBe(files[i])
        })
      })
    )
  })

  // status に対応するデータしか持てないことは BatchFileStatus のユニオンが保証するので、
  // ここでは型に書けない進捗の値だけを確かめる
  test('どの操作列をたどっても、進捗は status と食い違わない', () => {
    fc.assert(
      fc.property(fileList, anyActionSequence, (files, actions) => {
        for (const item of reachable(initial(files), actions)) {
          expect(item.progress).toBeGreaterThanOrEqual(0)
          expect(item.progress).toBeLessThanOrEqual(100)
          if (item.status === 'pending') expect(item.progress).toBe(0)
          if (item.status === 'completed') expect(item.progress).toBe(100)
        }
      })
    )
  })

  test('進捗で状態が作り直されるのは、変換中に値が動いたときだけ', () => {
    fc.assert(
      fc.property(
        fileList,
        indexedSequence,
        itemIndex,
        progressValue,
        (files, actions, index, value) => {
          const before = reachable(initial(files), actions)
          const item = before[index]
          const moves = item?.status === 'converting' && item.progress !== value
          const after = batchReducer(before, { type: 'progress', index, value })
          // 決着後に遅れて届いた進捗も、同じ値の繰り返しも、描き直しを起こさない
          expect(after === before).toBe(!moves)
        }
      )
    )
  })

  test('同じ進捗を続けて受けても、2 回目は状態を作り直さない', () => {
    fc.assert(
      fc.property(fileList, itemIndex, progressValue, (files, index, value) => {
        const converting = batchReducer(initial(files), { type: 'start', index })
        const once = batchReducer(converting, { type: 'progress', index, value })
        expect(batchReducer(once, { type: 'progress', index, value })).toBe(once)
      })
    )
  })

  test('取り消しはどの状態からでも空にし、選び直しは履歴を残さない', () => {
    fc.assert(
      fc.property(
        fileList,
        anyActionSequence,
        fileList,
        (files, actions, next) => {
          const before = reachable(initial(files), actions)
          expect(batchReducer(before, { type: 'clear' })).toEqual(initialBatchState)
          expect(batchReducer(before, { type: 'init', files: next })).toEqual(initial(next))
        }
      )
    )
  })
})

/**
 * useBatchConversion が実際に流す順序（1 件ずつ start → progress* → 決着）を組み立てる。
 * 変換は何度でも走らせ直せるので、同じ添字を跨ぐ複数回のランも作る。
 */
type FilePlan = {
  progresses: number[]
  outcome: 'complete' | 'fail' | 'cancel' | 'skip'
}

const planWith = (...outcomes: FilePlan['outcome'][]): fc.Arbitrary<FilePlan> =>
  fc.record({
    progresses: fc.array(progressValue, { maxLength: 4 }),
    outcome: fc.constantFrom(...outcomes),
  })

const runPlans = fc.array(fc.array(planWith('complete', 'fail', 'cancel', 'skip'), { maxLength: 5 }), {
  minLength: 1,
  maxLength: 6,
})

const CONVERTED_SIZE = 1024

function runActions(plans: FilePlan[]): BatchAction[] {
  const actions: BatchAction[] = []
  for (const [index, plan] of plans.entries()) {
    // 中断したらそこで打ち切り、以降の件には手をつけない
    if (plan.outcome === 'skip') break
    actions.push({ type: 'start', index })
    for (const value of plan.progresses) actions.push({ type: 'progress', index, value })
    if (plan.outcome === 'complete')
      actions.push({ type: 'complete', index, convertedSize: CONVERTED_SIZE })
    else if (plan.outcome === 'fail') actions.push({ type: 'fail', index, message: 'boom' })
    else break
  }
  return actions
}

describe('batchReducer（変換ランが流す順序）', () => {
  test('最後まで走り切ったランでは、全件が完了か失敗のどちらかになる', () => {
    fc.assert(
      fc.property(
        fileList,
        fc.array(planWith('complete', 'fail'), { minLength: 5, maxLength: 5 }),
        (files, plans) => {
          for (const item of reachable(initial(files), runActions(plans))) {
            expect(['completed', 'error']).toContain(item.status)
            if (item.status === 'completed') expect(item.convertedSize).toBe(CONVERTED_SIZE)
            else if (item.status === 'error') expect(item.error).toBe('boom')
          }
        }
      )
    )
  })

  test('走らせ直すと、前回のランの決着は残らない', () => {
    fc.assert(
      fc.property(fileList, runPlans, (files, runs) => {
        const after = runs.reduce(
          (current, plans) => reachable(current, runActions(plans)),
          initial(files)
        )
        // 直前に決着していても、やり直しの start で必ず素の状態へ戻る
        expect(batchReducer(after, { type: 'start', index: 0 })[0]).toEqual({
          file: files[0],
          status: 'converting',
          progress: 0,
        })
      })
    )
  })
})
