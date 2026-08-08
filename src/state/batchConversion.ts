import type { BatchFileStatus, ConversionResult } from '../types'

export type BatchState = BatchFileStatus[]

export type BatchAction =
  | { type: 'init'; files: File[] }
  | { type: 'clear' }
  | { type: 'start'; index: number }
  | { type: 'progress'; index: number; value: number }
  | { type: 'complete'; index: number; result: ConversionResult }
  | { type: 'fail'; index: number; message: string }

export const initialBatchState: BatchState = []

export function batchReducer(state: BatchState, action: BatchAction): BatchState {
  switch (action.type) {
    case 'init':
      return action.files.map((file) => ({ file, status: 'pending', progress: 0 }))
    case 'clear':
      return initialBatchState
    case 'start':
      return updateAt(state, action.index, { status: 'converting', progress: 0, error: undefined })
    case 'progress':
      return updateAt(state, action.index, { progress: action.value })
    case 'complete':
      return updateAt(state, action.index, {
        status: 'completed',
        progress: 100,
        result: action.result,
      })
    case 'fail':
      return updateAt(state, action.index, { status: 'error', error: action.message })
  }
}

function updateAt(
  state: BatchState,
  index: number,
  patch: Partial<BatchFileStatus>
): BatchState {
  if (!state[index]) return state
  return state.map((item, i) => (i === index ? { ...item, ...patch } : item))
}
