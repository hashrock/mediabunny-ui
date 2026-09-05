import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { batchReducer, initialBatchState } from './batchConversion'
import type { BatchAction, BatchState } from './batchConversion'
import { conversionResult, progressValue, videoFile } from '../test/arbitraries'
import type { ConversionResult } from '../types'

const fileList = fc.array(videoFile, { minLength: 1, maxLength: 5 })

/** 特定の 1 件に向けた操作。ファイル一覧そのものは動かさない */
type IndexedAction = Extract<BatchAction, { index: number }>

const actionAt = (index: number): fc.Arbitrary<IndexedAction> =>
  fc.oneof(
    fc.constant({ type: 'start', index } as const),
    progressValue.map((value) => ({ type: 'progress', index, value }) as const),
    conversionResult.map((result) => ({ type: 'complete', index, result }) as const),
    fc.string().map((message) => ({ type: 'fail', index, message }) as const)
  )

/** 一覧の長さ（最大 5 件）の外側も混ぜる。変換中にファイルを選び直すと起こりうる */
const indexedAction = fc.integer({ min: -2, max: 7 }).chain(actionAt)

const indexedSequence = fc.array(indexedAction, { maxLength: 20 })

const anyAction: fc.Arbitrary<BatchAction> = fc.oneof(
  fileList.map((files) => ({ type: 'init', files }) as const),
  fc.constant({ type: 'clear' } as const),
  indexedAction
)

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

  test('取り消しはどの状態からでも空にし、選び直しは履歴を残さない', () => {
    fc.assert(
      fc.property(
        fileList,
        fc.array(anyAction, { maxLength: 20 }),
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

const filePlan: fc.Arbitrary<FilePlan> = fc.record({
  progresses: fc.array(progressValue, { maxLength: 4 }),
  outcome: fc.constantFrom('complete', 'fail', 'cancel', 'skip'),
})

const runPlans = fc.array(fc.array(filePlan, { maxLength: 5 }), { minLength: 1, maxLength: 3 })

function runActions(plans: FilePlan[], result: ConversionResult): BatchAction[] {
  const actions: BatchAction[] = []
  for (const [index, plan] of plans.entries()) {
    // 中断したらそこで打ち切り、以降の件には手をつけない
    if (plan.outcome === 'skip') break
    actions.push({ type: 'start', index })
    for (const value of plan.progresses) actions.push({ type: 'progress', index, value })
    if (plan.outcome === 'complete') actions.push({ type: 'complete', index, result })
    else if (plan.outcome === 'fail') actions.push({ type: 'fail', index, message: 'boom' })
    else break
  }
  return actions
}

describe('batchReducer（変換ランが流す順序）', () => {
  test('何度走らせ直しても、状態と表示に使う値が食い違わない', () => {
    fc.assert(
      fc.property(fileList, runPlans, conversionResult, (files, runs, result) => {
        const state = runs.reduce(
          (current, plans) => reachable(current, runActions(plans, result)),
          initial(files)
        )

        for (const item of state) {
          switch (item.status) {
            case 'pending':
              // 触れていない件は初期値のまま
              expect(item.progress).toBe(0)
              expect(item.result).toBeUndefined()
              expect(item.error).toBeUndefined()
              break
            case 'converting':
              // やり直しでは前回の失敗を引きずらない
              expect(item.error).toBeUndefined()
              break
            case 'completed':
              expect(item.progress).toBe(100)
              expect(item.result).toBe(result)
              break
            case 'error':
              expect(item.error).toBe('boom')
              break
          }
        }
      })
    )
  })
})
