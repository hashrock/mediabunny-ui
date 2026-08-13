import { useMemo } from 'react'
import type { RefObject } from 'react'
import type { ConversionResult } from '../types'

interface VideoPreviewProps {
  file: File
  videoRef: RefObject<HTMLVideoElement | null>
  result: ConversionResult | null
  converting: boolean
  progress: number
  showAfter: boolean
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

/** 変換前後の映像だけを映す領域。操作系はサイドバーと下バーに集約している */
export function VideoPreview({
  file,
  videoRef,
  result,
  converting,
  progress,
  showAfter,
  error,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: VideoPreviewProps) {
  const originalUrl = useMemo(() => URL.createObjectURL(file), [file])
  const previewUrl = useMemo(
    () =>
      result
        ? URL.createObjectURL(new Blob([result.buffer], { type: mimeTypeOf(result.filename) }))
        : '',
    [result]
  )

  // GIF は video 要素で再生できないため、結果の種類によって表示要素を変える
  const isGifResult = result?.filename.endsWith('.gif') ?? false

  return (
    <main
      className={`preview-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <video
        ref={videoRef}
        src={originalUrl}
        className="preview-video"
        style={{
          opacity: !result || !showAfter ? 1 : 0,
          pointerEvents: !result || !showAfter ? 'auto' : 'none',
        }}
      />
      {result &&
        (isGifResult ? (
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
        ))}

      {converting && (
        <div className="conversion-overlay">
          <div className="conversion-progress">
            <div className="conversion-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="conversion-text">{progress}%</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </main>
  )
}
