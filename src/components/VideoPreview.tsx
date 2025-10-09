import { useMemo, useState } from 'react'
import type { ConversionResult } from '../types'

interface VideoPreviewProps {
  file: File | null
  result: ConversionResult | null
  converting: boolean
  progress: number
  showAfter: boolean
  onToggleView: (showAfter: boolean) => void
  error: string
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  mediaDuration: number | null
  videoDimensions: { width: number; height: number } | null
  videoCodec: string | null
  audioCodec: string | null
  metadataTags: any
  onFileSelect: () => void
}

export function VideoPreview({
  file,
  result,
  converting,
  progress,
  showAfter,
  onToggleView,
  error,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  mediaDuration,
  videoDimensions,
  videoCodec,
  audioCodec,
  metadataTags,
}: VideoPreviewProps) {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const secondsToTimeString = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const compressionRatio = result
    ? ((1 - result.convertedSize / result.originalSize) * 100)
    : 0

  const compressionDisplay = compressionRatio > 0
    ? `-${compressionRatio.toFixed(1)}%`
    : compressionRatio < 0
    ? `+${Math.abs(compressionRatio).toFixed(1)}%`
    : '0%'

  const originalUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  const previewUrl = useMemo(
    () => result ? URL.createObjectURL(new Blob([result.buffer])) : '',
    [result]
  )

  return (
    <main
      className={`preview-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {file && (
        <>
          <div className="file-info-overlay">
            <div className="file-info-details">
              <span className="file-detail">
                <span className="detail-label">Size:</span> {formatBytes(file.size)}
              </span>
              {videoDimensions && (
                <span className="file-detail">
                  <span className="detail-label">Resolution:</span> {videoDimensions.width}x{videoDimensions.height}
                </span>
              )}
              {mediaDuration && (
                <span className="file-detail">
                  <span className="detail-label">Duration:</span> {secondsToTimeString(mediaDuration)}
                </span>
              )}
              <button
                className="expand-btn"
                onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                title={isDetailExpanded ? "Hide details" : "Show details"}
              >
                {isDetailExpanded ? '▼' : '▶'}
              </button>
            </div>
            {isDetailExpanded && (
              <div className="file-info-expanded">
                <span className="file-detail">
                  <span className="detail-label">MIME Type:</span> {file.type || 'unknown'}
                </span>
                {videoCodec && (
                  <span className="file-detail">
                    <span className="detail-label">Video Codec:</span> {videoCodec}
                  </span>
                )}
                {audioCodec && (
                  <span className="file-detail">
                    <span className="detail-label">Audio Codec:</span> {audioCodec}
                  </span>
                )}
                {metadataTags?.title && (
                  <span className="file-detail">
                    <span className="detail-label">Title:</span> {metadataTags.title}
                  </span>
                )}
                {metadataTags?.artist && (
                  <span className="file-detail">
                    <span className="detail-label">Artist:</span> {metadataTags.artist}
                  </span>
                )}
                {metadataTags?.comment && (
                  <span className="file-detail">
                    <span className="detail-label">Comment:</span> {metadataTags.comment}
                  </span>
                )}
                {metadataTags?.description && (
                  <span className="file-detail">
                    <span className="detail-label">Description:</span> {metadataTags.description}
                  </span>
                )}
                <span className="file-detail">
                  <span className="detail-label">Last Modified:</span> {new Date(file.lastModified).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <video
            src={originalUrl}
            controls
            className="preview-video"
            style={{
              opacity: !result || !showAfter ? 1 : 0,
              pointerEvents: !result || !showAfter ? 'auto' : 'none',
            }}
          />
          {result && (
            <video
              src={previewUrl}
              controls
              className="preview-video preview-video-after"
              style={{
                opacity: showAfter ? 1 : 0,
                pointerEvents: showAfter ? 'auto' : 'none',
              }}
            />
          )}

          {converting && (
            <div className="conversion-overlay">
              <div className="conversion-progress">
                <div
                  className="conversion-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="conversion-text">{progress}%</div>
            </div>
          )}

          {result && (
            <div className="toggle-container">
              <button
                className={`toggle-btn ${!showAfter ? 'active' : ''}`}
                onClick={() => onToggleView(false)}
              >
                Before{' '}
                <span className="size-badge">
                  {formatBytes(result.originalSize)}
                </span>
              </button>
              <button
                className={`toggle-btn ${showAfter ? 'active' : ''}`}
                onClick={() => onToggleView(true)}
              >
                After{' '}
                <span className="size-badge">
                  {formatBytes(result.convertedSize)}
                </span>
                <span className={`compression-badge ${compressionRatio < 0 ? 'negative' : ''}`}>
                  {compressionDisplay}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {error && <div className="error-message">{error}</div>}
    </main>
  )
}
