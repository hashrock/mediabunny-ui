import { useEffect, useState } from 'react'
import { estimateOutputSize } from '../converters'
import type { ConversionSettings, MediaInfo, PreviewEstimate } from '../types'
import { isAbortError } from '../utils/abort'

const DEBOUNCE_MS = 500

const IDLE: PreviewEstimate = { estimatedSize: 0, isEstimating: false }

interface UseSizeEstimateOptions {
  file: File | null
  settings: ConversionSettings
  media: MediaInfo | null
}

/**
 * 設定が落ち着いてから出力サイズを推定する。
 * 設定が変わると走行中の推定エンコードごと中断するので、
 * 古い推定結果が新しい結果を上書きすることはない。
 */
export function useSizeEstimate({
  file,
  settings,
  media,
}: UseSizeEstimateOptions): PreviewEstimate {
  const [estimate, setEstimate] = useState<PreviewEstimate>(IDLE)

  useEffect(() => {
    if (!file || !media) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setEstimate({ estimatedSize: 0, isEstimating: true })
      try {
        const estimatedSize = await estimateOutputSize({
          file,
          settings,
          media,
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        setEstimate({ estimatedSize, isEstimating: false })
      } catch (err) {
        if (isAbortError(err)) return
        console.error('Size estimation error:', err)
        setEstimate(IDLE)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [file, settings, media])

  // 対象がないときは、内部に残っている直前の推定値ではなく初期値を返す
  return file && media ? estimate : IDLE
}
