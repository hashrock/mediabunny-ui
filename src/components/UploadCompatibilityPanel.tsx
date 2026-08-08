import type { ConversionSettings, PreviewEstimate } from '../types'
import serviceLimits from '../serviceLimits.json'
import { formatBytes } from '../utils/format'

interface UploadCompatibilityPanelProps {
  previewEstimate: PreviewEstimate
  settings: ConversionSettings
  mediaDuration: number | null
}

export function UploadCompatibilityPanel({
  previewEstimate,
  settings,
  mediaDuration,
}: UploadCompatibilityPanelProps) {
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

  const duration = (settings.endTime ?? mediaDuration ?? 0) - (settings.startTime ?? 0)
  const compatibility = previewEstimate.estimatedSize > 0 
    ? checkServiceCompatibility(previewEstimate.estimatedSize, duration)
    : []

  return (
    <div className="upload-compatibility-panel">
      <div className="panel-header">
        <h3>Upload Compatibility</h3>
      </div>
      <div className="panel-content">
        {previewEstimate.isEstimating && (
          <div className="panel-status">
            <span>Calculating estimated size...</span>
          </div>
        )}
        {!previewEstimate.isEstimating && previewEstimate.estimatedSize === 0 && (
          <div className="panel-status">
            <span>No file selected or estimation not available</span>
          </div>
        )}
        {!previewEstimate.isEstimating && previewEstimate.estimatedSize > 0 && (
          <>
            <div className="estimated-size">
              <span className="size-label">Estimated Size:</span>
              <span className="size-value">{formatBytes(previewEstimate.estimatedSize)}</span>
            </div>
            <div className="compatibility-list">
              {compatibility.map((service) => (
                <div key={service.name} className="service-item">
                  <div className="service-header">
                    <strong>{service.name}</strong>
                  </div>
                  <div className="service-tiers">
                    {service.tierResults.map((tier, idx) => (
                      <div key={idx} className={`tier-row ${tier.compatible ? 'compatible' : 'incompatible'}`}>
                        <div className="tier-left">
                          <span className="tier-icon">{tier.compatible ? '✓' : '✗'}</span>
                          <span className="tier-label">{tier.tier}</span>
                        </div>
                        <div className="tier-right">
                          <span className={tier.sizeExceeded ? 'exceeded' : ''}>
                            {formatBytes(tier.maxSize)}
                          </span>
                          {tier.maxDuration && (
                            <>
                              <span className="separator">•</span>
                              <span className={tier.durationExceeded ? 'exceeded' : ''}>
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
          </>
        )}
      </div>
    </div>
  )
}
