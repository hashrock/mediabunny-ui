import { useCallback, useReducer, useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import { encode, toConversionResult } from '../converters'
import { batchReducer, initialBatchState } from '../state/batchConversion'
import type { BatchFileStatus, ConversionSettings } from '../types'
import { isAbortError } from '../utils/abort'
import { pickOutputDirectory, writeFileToDirectory } from '../utils/fileSystem'

export interface BatchConversion {
  files: BatchFileStatus[]
  running: boolean
  error: string
  setFiles: (files: File[]) => void
  clear: () => void
  run: () => Promise<void>
  cancel: () => void
}

export function useBatchConversion(settings: ConversionSettings): BatchConversion {
  const { t } = useI18n()
  const [files, dispatch] = useReducer(batchReducer, initialBatchState)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const setFiles = useCallback((selected: File[]) => {
    setError('')
    dispatch({ type: 'init', files: selected })
  }, [])

  const clear = useCallback(() => {
    setError('')
    dispatch({ type: 'clear' })
  }, [])

  const run = useCallback(async () => {
    if (files.length === 0) return
    setError('')

    let directory: FileSystemDirectoryHandle
    try {
      directory = await pickOutputDirectory()
    } catch (err) {
      setError(
        isAbortError(err)
          ? t.errorFolderCancelled
          : err instanceof Error
            ? err.message
            : t.errorFolderFailed
      )
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)

    try {
      for (const [index, item] of files.entries()) {
        if (controller.signal.aborted) break

        dispatch({ type: 'start', index })
        try {
          const encoded = await encode({
            file: item.file,
            // 長さの異なるファイルが混ざるため、バッチでは常に全体を変換する
            trim: null,
            settings,
            signal: controller.signal,
            onProgress: (progress) =>
              dispatch({ type: 'progress', index, value: Math.round(progress * 100) }),
          })
          await writeFileToDirectory(directory, encoded.filename, encoded.buffer)
          dispatch({ type: 'complete', index, result: toConversionResult(item.file, encoded) })
        } catch (err) {
          if (isAbortError(err)) break
          console.error('Conversion error for', item.file.name, ':', err)
          dispatch({
            type: 'fail',
            index,
            message: err instanceof Error ? err.message : t.errorConversionFailed,
          })
        }
      }
    } finally {
      setRunning(false)
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [files, settings, t])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return { files, running, error, setFiles, clear, run, cancel }
}
