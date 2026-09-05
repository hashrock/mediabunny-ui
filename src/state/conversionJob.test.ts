import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import {
  initialJobState,
  isJobRunning,
  jobErrorMessage,
  jobProgress,
  jobReducer,
  jobResult,
} from './conversionJob'
import type { JobAction, JobState } from './conversionJob'
import { conversionResult, progressValue } from '../test/arbitraries'

const jobAction: fc.Arbitrary<JobAction> = fc.oneof(
  fc.constant({ type: 'start' } as const),
  progressValue.map((value) => ({ type: 'progress', value }) as const),
  conversionResult.map((result) => ({ type: 'done', result }) as const),
  fc.string().map((message) => ({ type: 'fail', message }) as const),
  fc.constant({ type: 'cancel' } as const),
  fc.constant({ type: 'reset' } as const)
)

const actionSequence = fc.array(jobAction, { maxLength: 20 })

const reachable = (actions: JobAction[]): JobState =>
  actions.reduce(jobReducer, initialJobState)

describe('jobReducer', () => {
  test('どの操作列からたどり着いた状態でも、取り出し関数と食い違わない', () => {
    fc.assert(
      fc.property(actionSequence, (actions) => {
        const state = reachable(actions)
        expect(isJobRunning(state)).toBe(state.kind === 'running')
        expect(jobResult(state) !== null).toBe(state.kind === 'done')
        if (jobErrorMessage(state) !== '') expect(state.kind).toBe('error')
      })
    )
  })

  test('進捗は 0〜100 に収まり、完了は必ず 100 として読める', () => {
    fc.assert(
      fc.property(actionSequence, (actions) => {
        const state = reachable(actions)
        const progress = jobProgress(state)
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
        if (state.kind === 'done') expect(progress).toBe(100)
        if (state.kind === 'running') expect(progress).toBe(state.progress)
      })
    )
  })

  test('やり直しはどの状態からでも初期状態へ戻す（吸収的）', () => {
    fc.assert(
      fc.property(actionSequence, (actions) => {
        expect(jobReducer(reachable(actions), { type: 'reset' })).toEqual(initialJobState)
      })
    )
  })

  test('進捗で状態が作り直されるのは、走行中に値が動いたときだけ', () => {
    fc.assert(
      fc.property(actionSequence, progressValue, (actions, value) => {
        const state = reachable(actions)
        const moves = state.kind === 'running' && state.progress !== value
        // 中断後に遅れて届いた進捗も、同じ値の繰り返しも、描き直しを起こさない
        expect(jobReducer(state, { type: 'progress', value }) === state).toBe(!moves)
      })
    )
  })

  test('同じ進捗を続けて受けても、2 回目は状態を作り直さない', () => {
    fc.assert(
      fc.property(actionSequence, progressValue, (actions, value) => {
        const started = jobReducer(reachable(actions), { type: 'start' })
        const once = jobReducer(started, { type: 'progress', value })
        expect(jobReducer(once, { type: 'progress', value })).toBe(once)
      })
    )
  })

  test('同じ操作を続けて 2 回当てても 1 回と変わらない（冪等性）', () => {
    fc.assert(
      fc.property(actionSequence, jobAction, (actions, action) => {
        const once = jobReducer(reachable(actions), action)
        expect(jobReducer(once, action)).toEqual(once)
      })
    )
  })

  test('走り出したあとの進捗列は最後の値だけが残る', () => {
    fc.assert(
      fc.property(
        actionSequence,
        fc.array(progressValue, { minLength: 1, maxLength: 8 }),
        (actions, values) => {
          const started = jobReducer(reachable(actions), { type: 'start' })
          const state = values.reduce(
            (current, value) => jobReducer(current, { type: 'progress', value }),
            started
          )
          expect(state).toEqual({ kind: 'running', progress: values[values.length - 1] })
        }
      )
    )
  })
})
