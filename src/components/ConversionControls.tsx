import type { ConversionSettings } from '../types'

interface ConversionControlsProps {
  settings: ConversionSettings
  onSettingsChange: (settings: ConversionSettings) => void
  onConvert: () => void
  onReset: () => void
  onDownload: () => void
  converting: boolean
  progress: number
  hasResult: boolean
  isVideo: boolean
  mediaDuration: number | null
}

export function ConversionControls({
  settings,
  onSettingsChange,
  onConvert,
  onReset,
  onDownload,
  converting,
  progress,
  hasResult,
  isVideo,
  mediaDuration,
}: ConversionControlsProps) {
  return (
    <div className="controls">
      <div className="logo">
        <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 14 L11 8 Q11 6, 11.5 5 Q12 6, 12 8 L12 13"/>
          <path d="M21 14 L21 8 Q21 6, 20.5 5 Q20 6, 20 8 L20 13"/>
          <circle cx="16" cy="18" r="7" fill="currentColor" stroke="none"/>
          <circle cx="13.5" cy="17" r="1" fill="#fff"/>
          <circle cx="18.5" cy="17" r="1" fill="#fff"/>
        </svg>
      </div>

      <div className="control-group">
        <label>Format</label>
        <select
          value={settings.format}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              format: e.target.value as 'mp4' | 'webm',
            })
          }
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
        </select>
      </div>

      <div className="control-group">
        <label>Quality {settings.quality}%</label>
        <input
          type="range"
          min="1"
          max="100"
          value={settings.quality}
          onChange={(e) =>
            onSettingsChange({ ...settings, quality: Number(e.target.value) })
          }
        />
      </div>

      <div className="control-group">
        <label>Width</label>
        <input
          type="number"
          placeholder="Auto"
          value={settings.width || ''}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              width: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="control-group">
        <label>Height</label>
        <input
          type="number"
          placeholder="Auto"
          value={settings.height || ''}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              height: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      {isVideo && mediaDuration && (
        <>
          <div className="control-group time-group">
            <label>Start</label>
            <div className="time-inputs">
              <input
                type="number"
                min="0"
                max="23"
                placeholder="00"
                value={
                  settings.startTime !== undefined
                    ? Math.floor(settings.startTime / 3600)
                    : ''
                }
                onChange={(e) => {
                  const hours = e.target.value
                    ? Math.min(23, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.startTime || 0
                  const minutes = Math.floor((currentSeconds % 3600) / 60)
                  const seconds = Math.floor(currentSeconds % 60)
                  onSettingsChange({
                    ...settings,
                    startTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="00"
                value={
                  settings.startTime !== undefined
                    ? Math.floor((settings.startTime % 3600) / 60)
                    : ''
                }
                onChange={(e) => {
                  const minutes = e.target.value
                    ? Math.min(59, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.startTime || 0
                  const hours = Math.floor(currentSeconds / 3600)
                  const seconds = Math.floor(currentSeconds % 60)
                  onSettingsChange({
                    ...settings,
                    startTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="00"
                value={
                  settings.startTime !== undefined
                    ? Math.floor(settings.startTime % 60)
                    : ''
                }
                onChange={(e) => {
                  const seconds = e.target.value
                    ? Math.min(59, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.startTime || 0
                  const hours = Math.floor(currentSeconds / 3600)
                  const minutes = Math.floor((currentSeconds % 3600) / 60)
                  onSettingsChange({
                    ...settings,
                    startTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
            </div>
          </div>

          <div className="control-group time-group">
            <label>End</label>
            <div className="time-inputs">
              <input
                type="number"
                min="0"
                max="23"
                placeholder="00"
                value={
                  settings.endTime !== undefined
                    ? Math.floor(settings.endTime / 3600)
                    : ''
                }
                onChange={(e) => {
                  const hours = e.target.value
                    ? Math.min(23, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.endTime || 0
                  const minutes = Math.floor((currentSeconds % 3600) / 60)
                  const seconds = Math.floor(currentSeconds % 60)
                  onSettingsChange({
                    ...settings,
                    endTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="00"
                value={
                  settings.endTime !== undefined
                    ? Math.floor((settings.endTime % 3600) / 60)
                    : ''
                }
                onChange={(e) => {
                  const minutes = e.target.value
                    ? Math.min(59, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.endTime || 0
                  const hours = Math.floor(currentSeconds / 3600)
                  const seconds = Math.floor(currentSeconds % 60)
                  onSettingsChange({
                    ...settings,
                    endTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="00"
                value={
                  settings.endTime !== undefined
                    ? Math.floor(settings.endTime % 60)
                    : ''
                }
                onChange={(e) => {
                  const seconds = e.target.value
                    ? Math.min(59, Math.max(0, Number(e.target.value)))
                    : 0
                  const currentSeconds = settings.endTime || 0
                  const hours = Math.floor(currentSeconds / 3600)
                  const minutes = Math.floor((currentSeconds % 3600) / 60)
                  onSettingsChange({
                    ...settings,
                    endTime: hours * 3600 + minutes * 60 + seconds,
                  })
                }}
              />
            </div>
          </div>

          <button onClick={onReset} className="reset-btn">
            Reset
          </button>
        </>
      )}

      <div className="action-buttons">
        <button onClick={onConvert} disabled={converting} className="convert-btn">
          {converting ? `${progress}%` : 'Convert'}
        </button>
        {hasResult && (
          <button onClick={onDownload} className="download-btn">
            Download
          </button>
        )}
      </div>
    </div>
  )
}
