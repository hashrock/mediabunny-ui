import { useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import { LANGS } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import type { ConversionSettings, MediaInfo, OutputFormat, PreviewEstimate } from '../types'
import { formatBytes, formatTimecode } from '../utils/format'
import { CompatibilityList } from './CompatibilityList'

interface SidebarProps {
  file: File | null
  media: MediaInfo | null
  batchFileCount: number
  settings: ConversionSettings
  onSettingsChange: (settings: ConversionSettings) => void
  onFileSelect: (file: File) => void
  onFilesSelect: (files: File[]) => void
  onResetSettings: () => void
  previewEstimate: PreviewEstimate
  converting: boolean
  progress: number
  hasResult: boolean
  stale: boolean
  onConvert: () => void
  onBatchConvert: () => void
  onCancel: () => void
  onDownload: () => void
}

/** 文言のうち、そのまま表示できる（引数を取らない）ものの名前 */
type TextKey = {
  [K in keyof Messages]: Messages[K] extends string ? K : never
}[keyof Messages]

const FORMATS: { value: OutputFormat; label: string; hint: TextKey }[] = [
  { value: 'mp4', label: 'MP4', hint: 'formatHintMp4' },
  { value: 'webm', label: 'WebM', hint: 'formatHintWebm' },
  { value: 'gif', label: 'GIF', hint: 'formatHintGif' },
]

/** 縦に並べる解像度プリセット（高さ基準） */
const HEIGHT_PRESETS = [1080, 720, 480, 360]

const evenNumber = (value: number) => Math.max(2, Math.round(value / 2) * 2)

function Step({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="step">
      <h2 className="step-title">
        <span className="step-index">{index}</span>
        {title}
      </h2>
      <div className="step-body">{children}</div>
    </section>
  )
}

/**
 * 変換の手順（入力 → 形式 → 画質 → 解像度 → 見込み → 実行）を上から下に並べたパネル。
 */
export function Sidebar({
  file,
  media,
  batchFileCount,
  settings,
  onSettingsChange,
  onFileSelect,
  onFilesSelect,
  onResetSettings,
  previewEstimate,
  converting,
  progress,
  hasResult,
  stale,
  onConvert,
  onBatchConvert,
  onCancel,
  onDownload,
}: SidebarProps) {
  const { t, lang, setLang } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const dimensions = media?.dimensions ?? null
  const currentFormat = FORMATS.find((format) => format.value === settings.format)
  const trimmedDuration =
    (settings.endTime ?? media?.duration ?? 0) - (settings.startTime ?? 0)

  const applyHeightPreset = (height: number) => {
    if (!dimensions) return
    const scaled = evenNumber((dimensions.width * height) / dimensions.height)
    onSettingsChange({ ...settings, width: scaled, height: evenNumber(height) })
  }

  const isPresetActive = (height: number) =>
    !!dimensions &&
    settings.height === evenNumber(height) &&
    settings.width === evenNumber((dimensions.width * height) / dimensions.height)

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M39.6018 86.2478C2.00431 94.9039 6.19952 53.9469 23.7246 50.4125C32.6017 48.6222 14.5781 14.1139 32.1539 13.0413C46.2146 12.1833 36.3339 44.8067 48.6748 46.0905C61.0157 47.3744 46.8788 10.5945 64.7008 11.9515C82.5229 13.3084 68.4816 44.7593 76.8022 52.4154C97 71.0001 71.7956 98.756 61 86.2478C53.3734 77.4113 69 57.5 87 93" stroke="#8E6F70" strokeWidth="9" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="app-name">mediabunny</span>
        <div className="lang-switch">
          {LANGS.map((value) => (
            <button
              key={value}
              className={`lang-btn ${lang === value ? 'active' : ''}`}
              onClick={() => setLang(value)}
              title={t.langLabel[value]}
              aria-pressed={lang === value}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-scroll">
        <Step index={1} title={t.stepInput}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const selected = e.target.files?.[0]
              if (selected) onFileSelect(selected)
              e.target.value = ''
            }}
          />
          <input
            ref={batchInputRef}
            type="file"
            accept="video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const selected = e.target.files
              if (selected && selected.length > 0) onFilesSelect(Array.from(selected))
              e.target.value = ''
            }}
          />

          {file ? (
            <div className="source">
              <div className="source-name" title={file.name}>
                {file.name}
              </div>
              <dl className="source-facts">
                <div>
                  <dt>{t.factSize}</dt>
                  <dd>{formatBytes(file.size)}</dd>
                </div>
                {dimensions && (
                  <div>
                    <dt>{t.factResolution}</dt>
                    <dd>
                      {dimensions.width}×{dimensions.height}
                    </dd>
                  </div>
                )}
                {media && (
                  <div>
                    <dt>{t.factDuration}</dt>
                    <dd>{formatTimecode(media.duration)}</dd>
                  </div>
                )}
              </dl>

              <button className="disclosure" onClick={() => setDetailsOpen(!detailsOpen)}>
                {detailsOpen ? '▼' : '▶'} {t.details}
              </button>
              {detailsOpen && (
                <dl className="source-facts source-facts-detail">
                  <div>
                    <dt>{t.factMime}</dt>
                    <dd>{file.type || 'unknown'}</dd>
                  </div>
                  {media?.videoCodec && (
                    <div>
                      <dt>{t.factVideoCodec}</dt>
                      <dd>{media.videoCodec}</dd>
                    </div>
                  )}
                  {media?.audioCodec && (
                    <div>
                      <dt>{t.factAudioCodec}</dt>
                      <dd>{media.audioCodec}</dd>
                    </div>
                  )}
                  {media?.tags?.title && (
                    <div>
                      <dt>{t.factTitle}</dt>
                      <dd>{media.tags.title}</dd>
                    </div>
                  )}
                  {media?.tags?.artist && (
                    <div>
                      <dt>{t.factArtist}</dt>
                      <dd>{media.tags.artist}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t.factModified}</dt>
                    <dd>{new Date(file.lastModified).toLocaleString(lang)}</dd>
                  </div>
                </dl>
              )}
            </div>
          ) : batchFileCount > 0 ? (
            <div className="source">
              <div className="source-name">{t.batchSelected(batchFileCount)}</div>
            </div>
          ) : (
            <p className="step-empty">{t.inputEmpty}</p>
          )}

          <div className="step-actions">
            <button className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
              {t.selectFile}
            </button>
            <button className="ghost-btn" onClick={() => batchInputRef.current?.click()}>
              {t.selectFiles}
            </button>
          </div>
        </Step>

        <Step index={2} title={t.stepFormat}>
          <div className="segmented">
            {FORMATS.map((format) => (
              <button
                key={format.value}
                className={`segment ${settings.format === format.value ? 'active' : ''}`}
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    format: format.value,
                    fps: format.value === 'gif' ? (settings.fps ?? 10) : settings.fps,
                  })
                }
              >
                {format.label}
              </button>
            ))}
          </div>
          {currentFormat && <p className="step-hint">{t[currentFormat.hint]}</p>}
        </Step>

        <Step index={3} title={settings.format === 'gif' ? t.stepFps : t.stepQuality}>
          {settings.format === 'gif' ? (
            <div className="field">
              <div className="field-head">
                <span>{t.fpsLabel}</span>
                <span className="field-value">{settings.fps ?? 10}</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.fps ?? 10}
                onChange={(e) => onSettingsChange({ ...settings, fps: Number(e.target.value) })}
              />
              <p className="step-hint">{t.fpsHint}</p>
            </div>
          ) : (
            <div className="field">
              <div className="field-head">
                <span>{t.qualityLabel}</span>
                <span className="field-value">{settings.quality}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.quality}
                onChange={(e) => onSettingsChange({ ...settings, quality: Number(e.target.value) })}
              />
              <p className="step-hint">{t.qualityHint}</p>
            </div>
          )}
        </Step>

        <Step index={4} title={t.stepResolution}>
          {dimensions && (
            <div className="preset-row">
              <button
                className={`chip ${!settings.width && !settings.height ? 'active' : ''}`}
                onClick={() =>
                  onSettingsChange({ ...settings, width: undefined, height: undefined })
                }
              >
                {t.originalSize}
              </button>
              {HEIGHT_PRESETS.filter((height) => height < dimensions.height).map((height) => (
                <button
                  key={height}
                  className={`chip ${isPresetActive(height) ? 'active' : ''}`}
                  onClick={() => applyHeightPreset(height)}
                >
                  {height}p
                </button>
              ))}
            </div>
          )}
          <div className="dimension-row">
            <label className="dimension-field">
              <span>{t.width}</span>
              <input
                type="number"
                placeholder={t.auto}
                value={settings.width || ''}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    width: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
            <span className="dimension-times">×</span>
            <label className="dimension-field">
              <span>{t.height}</span>
              <input
                type="number"
                placeholder={t.auto}
                value={settings.height || ''}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    height: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
          </div>
        </Step>

        <Step index={5} title={t.stepEstimate}>
          <div className="estimate">
            <div className="estimate-row">
              <span>{t.estimatedSize}</span>
              <strong>
                {previewEstimate.isEstimating
                  ? t.estimating
                  : previewEstimate.estimatedSize > 0
                    ? formatBytes(previewEstimate.estimatedSize)
                    : '—'}
              </strong>
            </div>
            <div className="estimate-row">
              <span>{t.outputDuration}</span>
              <strong>{trimmedDuration > 0 ? formatTimecode(trimmedDuration) : '—'}</strong>
            </div>
          </div>

          {previewEstimate.estimatedSize > 0 ? (
            <CompatibilityList
              estimatedSize={previewEstimate.estimatedSize}
              duration={trimmedDuration}
            />
          ) : (
            <p className="step-hint">{t.estimateEmpty}</p>
          )}
        </Step>

        <button className="link-btn" onClick={onResetSettings}>
          {t.resetSettings}
        </button>
      </div>

      <div className="sidebar-footer">
        {converting ? (
          <>
            <div className="footer-progress">
              <div className="footer-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <button className="cancel-btn block" onClick={onCancel}>
              {t.cancelWithProgress(progress)}
            </button>
          </>
        ) : (
          <>
            {batchFileCount > 0 ? (
              <button className="convert-btn block" onClick={onBatchConvert}>
                {t.convertBatch(batchFileCount)}
              </button>
            ) : (
              <button className="convert-btn block" onClick={onConvert} disabled={!file}>
                {hasResult ? (stale ? t.reconvertLong : t.convertAgain) : t.convert}
              </button>
            )}
            {hasResult && (
              <button className="download-btn block" onClick={onDownload}>
                {t.download}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
