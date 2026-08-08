import type { ConversionSettings, MediaInfo } from '../types'
import { DEFAULT_GIF_FPS } from './encodeGif'
import { encodeMedia } from './encodeMedia'

/** 実測に使う先頭サンプルの長さ（秒） */
const SAMPLE_DURATION = 1.0
/** GIF の 1 ピクセル・1 フレームあたりの推定バイト数 */
const GIF_BYTES_PER_PIXEL = 0.3

export interface EstimateOptions {
  file: File
  settings: ConversionSettings
  media: MediaInfo
  signal?: AbortSignal
}

/** 出力サイズの推定値をバイト単位で返す */
export async function estimateOutputSize({
  file,
  settings,
  media,
  signal,
}: EstimateOptions): Promise<number> {
  const start = Math.max(0, settings.startTime ?? 0)
  const end = settings.endTime ?? media.duration
  const duration = Math.max(0, end - start)
  if (duration === 0) return 0

  if (settings.format === 'gif') {
    return estimateGifSize(settings, media, duration)
  }

  // 先頭の一部だけを実際にエンコードし、その結果を区間全体へ引き伸ばす
  const sampleEnd = Math.min(start + SAMPLE_DURATION, end)
  const sampleDuration = sampleEnd - start
  if (sampleDuration <= 0) return 0

  const { buffer } = await encodeMedia({
    file,
    settings,
    trim: { start, end: sampleEnd },
    signal,
  })

  return Math.round((buffer.byteLength / sampleDuration) * duration)
}

/** GIF は部分エンコードしても全体の傾向を映さないため、解像度とフレーム数から概算する */
function estimateGifSize(
  settings: ConversionSettings,
  media: MediaInfo,
  duration: number
): number {
  const width = settings.width ?? media.dimensions?.width ?? 0
  const height = settings.height ?? media.dimensions?.height ?? 0
  const frames = Math.ceil(duration * (settings.fps ?? DEFAULT_GIF_FPS))
  return Math.round(width * height * frames * GIF_BYTES_PER_PIXEL)
}
