import type { MetadataTags } from 'mediabunny'

export type OutputFormat = 'mp4' | 'webm' | 'gif'

export interface ConversionSettings {
  format: OutputFormat
  width?: number
  height?: number
  quality: number
  startTime?: number
  endTime?: number
  fps?: number // GIF frame rate (default: 10)
}

export interface ConversionResult {
  buffer: ArrayBuffer
  originalSize: number
  convertedSize: number
  filename: string
}

export interface PreviewEstimate {
  estimatedSize: number
  isEstimating: boolean
}

export interface BatchFileStatus {
  file: File
  status: 'pending' | 'converting' | 'completed' | 'error'
  progress: number
  result?: ConversionResult
  error?: string
}

/** 入力ファイルから読み取ったメディア情報。常にまとめて取得・破棄する */
export interface MediaInfo {
  duration: number
  dimensions: { width: number; height: number } | null
  videoCodec: string | null
  audioCodec: string | null
  tags: MetadataTags | null
}

/** 入力ファイルから切り出す区間（秒） */
export interface Trim {
  start: number
  end: number
}
