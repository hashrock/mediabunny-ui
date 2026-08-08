import { useCallback, useReducer, useRef } from 'react'
import { encode, toConversionResult, toTrim } from '../converters'
import {
  initialJobState,
  isJobRunning,
  jobErrorMessage,
  jobProgress,
  jobReducer,
  jobResult,
} from '../state/conversionJob'
import type { JobState } from '../state/conversionJob'
import type { ConversionResult, ConversionSettings, MediaInfo } from '../types'
import { isAbortError } from '../utils/abort'
import { downloadBuffer } from '../utils/download'

interface UseConversionJobOptions {
  file: File | null
  settings: ConversionSettings
  media: MediaInfo | null
}

export interface ConversionJob {
  state: JobState
  running: boolean
  progress: number
  result: ConversionResult | null
  error: string
  convert: () => Promise<void>
  cancel: () => void
  reset: () => void
  download: () => void
}

export function useConversionJob({
  file,
  settings,
  media,
}: UseConversionJobOptions): ConversionJob {
  const [state, dispatch] = useReducer(jobReducer, initialJobState)
  const abortRef = useRef<AbortController | null>(null)

  const convert = useCallback(async () => {
    if (!file) return

    const controller = new AbortController()
    abortRef.current = controller
    dispatch({ type: 'start' })

    try {
      const encoded = await encode({
        file,
        settings,
        trim: toTrim(settings, media?.duration ?? null),
        signal: controller.signal,
        onProgress: (progress) => dispatch({ type: 'progress', value: Math.round(progress * 100) }),
      })
      dispatch({ type: 'done', result: toConversionResult(file, encoded) })
    } catch (err) {
      // 中断は cancel() 側で状態に反映済みなので、ここでは何もしない
      if (isAbortError(err)) return
      console.error('Conversion error:', err)
      dispatch({ type: 'fail', message: err instanceof Error ? err.message : 'Conversion failed' })
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [file, settings, media])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'cancel' })
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'reset' })
  }, [])

  const result = jobResult(state)

  const download = useCallback(() => {
    if (result) downloadBuffer(result.buffer, result.filename)
  }, [result])

  return {
    state,
    running: isJobRunning(state),
    progress: jobProgress(state),
    result,
    error: jobErrorMessage(state),
    convert,
    cancel,
    reset,
    download,
  }
}
