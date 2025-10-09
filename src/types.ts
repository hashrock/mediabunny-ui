export interface ConversionSettings {
  format: 'mp4' | 'webm'
  width?: number
  height?: number
  quality: number
  startTime?: number
  endTime?: number
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
