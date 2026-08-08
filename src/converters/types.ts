import type { ConversionResult, ConversionSettings, Trim } from '../types'

export interface EncodedResult {
  buffer: ArrayBuffer
  filename: string
}

export interface EncodeOptions {
  file: File
  settings: ConversionSettings
  /** 切り出す区間。null / 未指定なら入力全体 */
  trim?: Trim | null
  signal?: AbortSignal
  /** 進捗を 0..1 で通知する */
  onProgress?: (progress: number) => void
}

export function toConversionResult(file: File, encoded: EncodedResult): ConversionResult {
  return {
    buffer: encoded.buffer,
    originalSize: file.size,
    convertedSize: encoded.buffer.byteLength,
    filename: encoded.filename,
  }
}
