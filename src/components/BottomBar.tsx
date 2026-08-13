import type { RefObject } from 'react'
import { useVideoPlayback } from '../hooks/useVideoPlayback'
import type { ConversionResult, ConversionSettings } from '../types'
import { formatBytes, formatTimecode } from '../utils/format'
import { TimeField } from './TimeField'
import { Timeline } from './Timeline'

interface BottomBarProps {
  file: File
  videoRef: RefObject<HTMLVideoElement | null>
  duration: number
  settings: ConversionSettings
  onSettingsChange: (settings: ConversionSettings) => void
  result: ConversionResult | null
  showAfter: boolean
  onToggleView: (showAfter: boolean) => void
  converting: boolean
  progress: number
  /** 変換後に設定を触ったか。再変換を促すために使う */
  stale: boolean
  onConvert: () => void
  onCancel: () => void
  onDownload: () => void
}

/**
 * 画面下の操作帯。切り出し区間の調整と、変換 → 確認 → 再変換の往復をここで完結させる。
 */
export function BottomBar({
  file,
  videoRef,
  duration,
  settings,
  onSettingsChange,
  result,
  showAfter,
  onToggleView,
  converting,
  progress,
  stale,
  onConvert,
  onCancel,
  onDownload,
}: BottomBarProps) {
  const start = settings.startTime ?? 0
  const end = settings.endTime ?? duration
  const hasTimeline = duration > 0

  const playback = useVideoPlayback({
    videoRef,
    file,
    trim: hasTimeline ? { start, end } : null,
  })

  // 区間や再生位置をいじるのは変換前の映像に対してなので、結果を見ていたら入力側に戻す
  const showSource = () => {
    if (showAfter) onToggleView(false)
  }

  const setTrim = (trim: { start: number; end: number }) => {
    showSource()
    onSettingsChange({ ...settings, startTime: trim.start, endTime: trim.end })
  }

  const seek = (time: number) => {
    showSource()
    playback.seek(time)
  }

  const togglePlay = () => {
    showSource()
    playback.toggle()
  }

  const compressionRatio = result
    ? (1 - result.convertedSize / result.originalSize) * 100
    : 0
  const compressionDisplay =
    compressionRatio > 0
      ? `-${compressionRatio.toFixed(1)}%`
      : compressionRatio < 0
        ? `+${Math.abs(compressionRatio).toFixed(1)}%`
        : '0%'

  return (
    <div className="bottom-bar">
      {hasTimeline && (
        <div className="trim-row">
          <button
            className="transport-btn"
            onClick={togglePlay}
            title={playback.playing ? 'Pause' : 'Play'}
            aria-label={playback.playing ? 'Pause' : 'Play'}
          >
            {playback.playing ? '❚❚' : '▶'}
          </button>
          <span className="transport-time">
            {formatTimecode(playback.currentTime)}
            <span className="transport-time-total"> / {formatTimecode(duration)}</span>
          </span>

          <Timeline
            duration={duration}
            start={start}
            end={end}
            currentTime={playback.currentTime}
            onTrimChange={setTrim}
            onSeek={seek}
          />

          <span className="trim-length" title="Trimmed length">
            {formatTimecode(Math.max(0, end - start))}
          </span>
        </div>
      )}

      <div className="adjust-row">
        {hasTimeline && (
          <div className="trim-fields">
            <TimeField
              label="In"
              value={start}
              min={0}
              max={Math.max(0, end - 0.1)}
              onChange={(value) => setTrim({ start: value, end })}
            />
            <button
              className="ghost-btn"
              onClick={() => setTrim({ start: Math.min(playback.currentTime, end - 0.1), end })}
              title="Set trim start to the current position"
            >
              ⇤ 現在位置
            </button>

            <TimeField
              label="Out"
              value={end}
              min={Math.min(duration, start + 0.1)}
              max={duration}
              onChange={(value) => setTrim({ start, end: value })}
            />
            <button
              className="ghost-btn"
              onClick={() => setTrim({ start, end: Math.max(playback.currentTime, start + 0.1) })}
              title="Set trim end to the current position"
            >
              現在位置 ⇥
            </button>

            <button
              className="ghost-btn"
              onClick={() => setTrim({ start: 0, end: duration })}
              disabled={start === 0 && end === duration}
              title="Use the whole clip"
            >
              全体
            </button>
          </div>
        )}

        <div className="result-actions">
          {converting && (
            <>
              <div className="inline-progress">
                <div className="inline-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span className="inline-progress-text">{progress}%</span>
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </>
          )}

          {!converting && result && (
            <>
              <div className="compare-toggle">
                <button
                  className={`toggle-btn ${!showAfter ? 'active' : ''}`}
                  onClick={() => onToggleView(false)}
                >
                  Before <span className="size-badge">{formatBytes(result.originalSize)}</span>
                </button>
                <button
                  className={`toggle-btn ${showAfter ? 'active' : ''}`}
                  onClick={() => onToggleView(true)}
                >
                  After <span className="size-badge">{formatBytes(result.convertedSize)}</span>
                  <span className={`compression-badge ${compressionRatio < 0 ? 'negative' : ''}`}>
                    {compressionDisplay}
                  </span>
                </button>
              </div>

              <button
                className={`reconvert-btn ${stale ? 'stale' : ''}`}
                onClick={onConvert}
                title={stale ? 'Settings changed since the last conversion' : 'Convert again'}
              >
                {stale ? '● 再変換' : '再変換'}
              </button>
              <button className="download-btn" onClick={onDownload}>
                Download
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
