import type { ConversionSettings, PreviewEstimate } from '../types'

interface ConversionControlsProps {
  settings: ConversionSettings
  onSettingsChange: (settings: ConversionSettings) => void
  onConvert: () => void
  onBatchConvert: () => void
  onReset: () => void
  onDownload: () => void
  onCancel: () => void
  converting: boolean
  progress: number
  hasResult: boolean
  isVideo: boolean
  mediaDuration: number | null
  previewEstimate: PreviewEstimate
  hasFile: boolean
  hasBatchFiles: boolean
}

export function ConversionControls({
  settings,
  onSettingsChange,
  onConvert,
  onBatchConvert,
  onReset,
  onDownload,
  onCancel,
  converting,
  hasResult,
  isVideo,
  mediaDuration,
  hasFile,
  hasBatchFiles,
}: ConversionControlsProps) {
  return (
    <div className="controls">
      <div className="control-group">
        <label>Format</label>
        <select
          value={settings.format}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              format: e.target.value as 'mp4' | 'webm' | 'gif',
              fps: e.target.value === 'gif' ? (settings.fps ?? 10) : settings.fps,
            })
          }
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
          <option value="gif">GIF</option>
        </select>
      </div>

      {settings.format !== 'gif' && (
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
      )}

      {settings.format === 'gif' && (
        <div className="control-group">
          <label>FPS {settings.fps ?? 10}</label>
          <input
            type="range"
            min="1"
            max="30"
            value={settings.fps ?? 10}
            onChange={(e) =>
              onSettingsChange({ ...settings, fps: Number(e.target.value) })
            }
          />
        </div>
      )}

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
        {converting ? (
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        ) : (
          <>
            <button onClick={onConvert} disabled={converting || !hasFile} className="convert-btn">
              Convert
            </button>
            {hasBatchFiles && (
              <button onClick={onBatchConvert} disabled={converting} className="convert-btn">
                Batch Convert
              </button>
            )}
          </>
        )}
        {hasResult && (
          <button onClick={onDownload} className="download-btn">
            Download
          </button>
        )}
      </div>
    </div>
  )
}
