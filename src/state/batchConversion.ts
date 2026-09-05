import type { BatchFileStatus } from '../types'

export type BatchState = BatchFileStatus[]

export type BatchAction =
  | { type: 'init'; files: File[] }
  | { type: 'clear' }
  | { type: 'start'; index: number }
  | { type: 'progress'; index: number; value: number }
  | { type: 'complete'; index: number; convertedSize: number }
  | { type: 'fail'; index: number; message: string }

export const initialBatchState: BatchState = []

/**
 * バッチ変換の一覧。1 件ずつ差し替えるので、
 * 前のランの結果やエラーが次の状態に紛れ込むことはない。
 */
export function batchReducer(state: BatchState, action: BatchAction): BatchState {
  switch (action.type) {
    case 'init':
      return action.files.map((file) => ({ file, status: 'pending', progress: 0 }))
    case 'clear':
      return initialBatchState
    case 'start':
      return replaceAt(state, action.index, ({ file }) => ({
        file,
        status: 'converting',
        progress: 0,
      }))
    case 'progress': {
      const item = state[action.index]
      // 決着したあとに遅れて届いた進捗と、同じ値の繰り返しでは作り直さない
      if (item?.status !== 'converting' || item.progress === action.value) return state
      return replaceAt(state, action.index, () => ({ ...item, progress: action.value }))
    }
    case 'complete':
      return replaceAt(state, action.index, ({ file }) => ({
        file,
        status: 'completed',
        progress: 100,
        convertedSize: action.convertedSize,
      }))
    case 'fail':
      return replaceAt(state, action.index, ({ file, progress }) => ({
        file,
        progress,
        status: 'error',
        error: action.message,
      }))
  }
}

function replaceAt(
  state: BatchState,
  index: number,
  replace: (item: BatchFileStatus) => BatchFileStatus
): BatchState {
  const item = state[index]
  if (!item) return state
  return state.map((current, i) => (i === index ? replace(item) : current))
}
