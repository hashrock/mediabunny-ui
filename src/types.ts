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

interface BatchFileBase {
  file: File
  /** 変換の進み具合（0〜100） */
  progress: number
}

/**
 * バッチ変換 1 件の状態。取りうる形をユニオンで閉じているので
 * 「失敗したのに結果がある」といった組み合わせは表現できない。
 * 出力そのものは書き出し先へ保存済みなので、ここには表示に使う大きさだけを残す。
 */
export type BatchFileStatus =
  | (BatchFileBase & { status: 'pending' })
  | (BatchFileBase & { status: 'converting' })
  | (BatchFileBase & { status: 'completed'; convertedSize: number })
  | (BatchFileBase & { status: 'error'; error: string })

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
