import type { ConversionResult } from '../types'

/**
 * 単一ファイル変換の状態。取りうる形をユニオンで閉じているので
 * 「変換中なのに結果がある」といった組み合わせは表現できない。
 */
export type JobState =
  | { kind: 'idle' }
  | { kind: 'running'; progress: number }
  | { kind: 'done'; result: ConversionResult }
  | { kind: 'error'; message: string }
  | { kind: 'cancelled' }

export type JobAction =
  | { type: 'start' }
  | { type: 'progress'; value: number }
  | { type: 'done'; result: ConversionResult }
  | { type: 'fail'; message: string }
  | { type: 'cancel' }
  | { type: 'reset' }

export const initialJobState: JobState = { kind: 'idle' }

export function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case 'start':
      return { kind: 'running', progress: 0 }
    case 'progress':
      // 中断後に遅れて届いた進捗で状態を巻き戻さない
      return state.kind === 'running' ? { kind: 'running', progress: action.value } : state
    case 'done':
      return { kind: 'done', result: action.result }
    case 'fail':
      return { kind: 'error', message: action.message }
    case 'cancel':
      return { kind: 'cancelled' }
    case 'reset':
      return initialJobState
  }
}

export function isJobRunning(state: JobState): boolean {
  return state.kind === 'running'
}

export function jobProgress(state: JobState): number {
  if (state.kind === 'running') return state.progress
  return state.kind === 'done' ? 100 : 0
}

export function jobResult(state: JobState): ConversionResult | null {
  return state.kind === 'done' ? state.result : null
}

export function jobErrorMessage(state: JobState): string {
  if (state.kind === 'error') return state.message
  return state.kind === 'cancelled' ? 'Conversion cancelled' : ''
}
