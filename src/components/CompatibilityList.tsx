import { useState } from 'react'
import serviceLimits from '../serviceLimits.json'
import { formatBytes } from '../utils/format'

interface CompatibilityListProps {
  estimatedSize: number
  /** トリム後の長さ（秒） */
  duration: number
}

function checkServices(estimatedSize: number, duration: number) {
  return serviceLimits.services.map((service) => {
    const tierResults = service.limits.map((limit) => {
      const sizeOk = estimatedSize <= limit.maxSize
      const durationOk = !limit.maxDuration || duration <= limit.maxDuration
      return {
        ...limit,
        compatible: sizeOk && durationOk,
        sizeExceeded: !sizeOk,
        durationExceeded: !durationOk,
      }
    })
    return {
      ...service,
      compatible: tierResults.some((tier) => tier.compatible),
      // 通る中でいちばん条件の緩くないプラン＝一覧の先頭にある通過プラン
      passingTier: tierResults.find((tier) => tier.compatible)?.tier ?? null,
      tierResults,
    }
  })
}

/**
 * 推定サイズが各サービスの投稿上限に収まるかの一覧。
 * ふだんは合否の数だけを出し、内訳はサービスごとに開いて確かめる。
 */
export function CompatibilityList({ estimatedSize, duration }: CompatibilityListProps) {
  const [open, setOpen] = useState(false)
  const [openService, setOpenService] = useState<string | null>(null)

  const services = checkServices(estimatedSize, duration)
  const okCount = services.filter((service) => service.compatible).length

  return (
    <div className="compat">
      <button className="compat-summary" onClick={() => setOpen(!open)}>
        <span className="compat-caret">{open ? '▼' : '▶'}</span>
        <span className="compat-summary-label">投稿先チェック</span>
        <span className="compat-count">
          {okCount}/{services.length}
        </span>
        <span className="compat-dots">
          {services.map((service) => (
            <span
              key={service.name}
              className={`compat-dot ${service.compatible ? 'ok' : 'ng'}`}
              title={service.name}
            />
          ))}
        </span>
      </button>

      {open && (
        <div className="compat-list">
          {services.map((service) => {
            const expanded = openService === service.name
            return (
              <div key={service.name} className="compat-service">
                <button
                  className="compat-service-row"
                  onClick={() => setOpenService(expanded ? null : service.name)}
                >
                  <span className={`compat-dot ${service.compatible ? 'ok' : 'ng'}`} />
                  <span className="compat-service-name">{service.name}</span>
                  <span className="compat-service-note">
                    {service.passingTier ?? '上限超過'}
                  </span>
                  <span className="compat-caret">{expanded ? '▼' : '▶'}</span>
                </button>

                {expanded && (
                  <div className="compat-tiers">
                    {service.tierResults.map((tier, index) => (
                      <div
                        key={index}
                        className={`compat-tier ${tier.compatible ? 'compatible' : 'incompatible'}`}
                      >
                        <span className="compat-tier-label">
                          {tier.compatible ? '✓' : '✗'} {tier.tier}
                        </span>
                        <span className="compat-tier-limits">
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
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
