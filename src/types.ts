export interface ConversionSettings {
  format: 'mp4' | 'webm' | 'gif'
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
