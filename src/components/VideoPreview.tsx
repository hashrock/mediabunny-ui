import { useMemo, useState } from 'react'
import type { ConversionResult, MediaInfo } from '../types'
import { formatBytes, formatDuration } from '../utils/format'

interface VideoPreviewProps {
  file: File
  media: MediaInfo | null
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
}

const MIME_TYPES: Record<string, string> = {
  gif: 'image/gif',
  webm: 'video/webm',
  mp4: 'video/mp4',
}

function mimeTypeOf(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  return MIME_TYPES[extension] ?? 'application/octet-stream'
}

export function VideoPreview({
  file,
  media,
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
}: VideoPreviewProps) {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false)

  const compressionRatio = result
    ? ((1 - result.convertedSize / result.originalSize) * 100)
    : 0

  const compressionDisplay = compressionRatio > 0
    ? `-${compressionRatio.toFixed(1)}%`
    : compressionRatio < 0
    ? `+${Math.abs(compressionRatio).toFixed(1)}%`
    : '0%'

  const originalUrl = useMemo(() => URL.createObjectURL(file), [file])
  const previewUrl = useMemo(
    () => result ? URL.createObjectURL(new Blob([result.buffer], { type: mimeTypeOf(result.filename) })) : '',
    [result]
  )

  // GIF は video 要素で再生できないため、結果の種類によって表示要素を変える
  const isGifResult = result?.filename.endsWith('.gif') ?? false

  const tags = media?.tags

  return (
    <main
      className={`preview-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="file-info-overlay">
        <div className="file-info-details">
          <span className="file-detail">
            <span className="detail-label">Size:</span> {formatBytes(file.size)}
          </span>
          {media?.dimensions && (
            <span className="file-detail">
              <span className="detail-label">Resolution:</span> {media.dimensions.width}x{media.dimensions.height}
            </span>
          )}
          {media && (
            <span className="file-detail">
              <span className="detail-label">Duration:</span> {formatDuration(media.duration)}
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
            {media?.videoCodec && (
              <span className="file-detail">
                <span className="detail-label">Video Codec:</span> {media.videoCodec}
              </span>
            )}
            {media?.audioCodec && (
              <span className="file-detail">
                <span className="detail-label">Audio Codec:</span> {media.audioCodec}
              </span>
            )}
            {tags?.title && (
              <span className="file-detail">
                <span className="detail-label">Title:</span> {tags.title}
              </span>
            )}
            {tags?.artist && (
              <span className="file-detail">
                <span className="detail-label">Artist:</span> {tags.artist}
              </span>
            )}
            {tags?.comment && (
              <span className="file-detail">
                <span className="detail-label">Comment:</span> {tags.comment}
              </span>
            )}
            {tags?.description && (
              <span className="file-detail">
                <span className="detail-label">Description:</span> {tags.description}
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
        isGifResult ? (
          <img
            src={previewUrl}
            alt="Converted GIF"
            className="preview-video preview-video-after"
            style={{
              opacity: showAfter ? 1 : 0,
              pointerEvents: showAfter ? 'auto' : 'none',
            }}
          />
        ) : (
          <video
            src={previewUrl}
            controls
            className="preview-video preview-video-after"
            style={{
              opacity: showAfter ? 1 : 0,
              pointerEvents: showAfter ? 'auto' : 'none',
            }}
          />
        )
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

      {error && <div className="error-message">{error}</div>}
    </main>
  )
}
