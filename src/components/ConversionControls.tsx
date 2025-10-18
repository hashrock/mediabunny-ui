import { useState } from 'react'
import type { ConversionSettings, PreviewEstimate } from '../types'
import serviceLimits from '../serviceLimits.json'

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
  previewEstimate,
  hasFile,
  hasBatchFiles,
}: ConversionControlsProps) {
  const [showServiceLimits, setShowServiceLimits] = useState(false)

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const checkServiceCompatibility = (estimatedSize: number, duration: number) => {
    return serviceLimits.services.map(service => {
      const tierResults = service.limits.map(limit => {
        const sizeOk = estimatedSize <= limit.maxSize
        const durationOk = !limit.maxDuration || duration <= limit.maxDuration
        return {
          ...limit,
          compatible: sizeOk && durationOk,
          sizeExceeded: !sizeOk,
          durationExceeded: !durationOk
        }
      })
      return {
        ...service,
        compatible: tierResults.some(t => t.compatible),
        tierResults
      }
    })
  }
  return (
    <div className="controls">
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

      <div className="control-group" style={{ position: 'relative' }}>
        <label>Estimated Size</label>
        <div
          style={{ color: '#666', fontSize: '0.9em', cursor: previewEstimate.estimatedSize > 0 ? 'pointer' : 'default', minHeight: '1.2em' }}
          onClick={() => previewEstimate.estimatedSize > 0 && setShowServiceLimits(!showServiceLimits)}
          title={previewEstimate.estimatedSize > 0 ? "Click to see upload compatibility" : ""}
        >
          {previewEstimate.estimatedSize > 0 ? (
            <>
              {previewEstimate.isEstimating ? 'Calculating...' : formatSize(previewEstimate.estimatedSize)} ℹ️
            </>
          ) : (
            <span style={{ color: '#ccc' }}>—</span>
          )}
        </div>
        {showServiceLimits && !previewEstimate.isEstimating && previewEstimate.estimatedSize > 0 && (
            <div className="service-limits-popup">
              <div className="service-limits-header">
                <span>Upload Compatibility</span>
                <button
                  className="close-popup-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowServiceLimits(false)
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="service-limits-content">
                {checkServiceCompatibility(
                  previewEstimate.estimatedSize,
                  (settings.endTime ?? mediaDuration ?? 0) - (settings.startTime ?? 0)
                ).map((service) => (
                  <div key={service.name} className="service-item-container">
                    <div className="service-item-header">
                      <strong>{service.name}</strong>
                    </div>
                    <div className="service-tiers-list">
                      {service.tierResults.map((tier, idx) => (
                        <div key={idx} className={`tier-item ${tier.compatible ? 'tier-ok' : 'tier-fail'}`}>
                          <div className="tier-info">
                            <span className="tier-status">{tier.compatible ? '✓' : '✗'}</span>
                            <span className="tier-name">{tier.tier}</span>
                          </div>
                          <div className="tier-limits">
                            <span className={tier.sizeExceeded ? 'limit-exceeded' : ''}>
                              {formatSize(tier.maxSize)}
                            </span>
                            {tier.maxDuration && (
                              <>
                                <span className="limit-separator">•</span>
                                <span className={tier.durationExceeded ? 'limit-exceeded' : ''}>
                                  {Math.floor(tier.maxDuration / 60)}m
                                  {tier.maxDuration % 60 > 0 ? ` ${tier.maxDuration % 60}s` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>

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
