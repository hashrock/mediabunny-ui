import { useRef, useState } from 'react'
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

const FORMATS: { value: OutputFormat; label: string; hint: string }[] = [
  { value: 'mp4', label: 'MP4', hint: 'H.264 / 汎用' },
  { value: 'webm', label: 'WebM', hint: 'VP9 / Web 向け' },
  { value: 'gif', label: 'GIF', hint: 'ループ画像' },
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const dimensions = media?.dimensions ?? null
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
      </div>

      <div className="sidebar-scroll">
        <Step index={1} title="入力">
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
                  <dt>サイズ</dt>
                  <dd>{formatBytes(file.size)}</dd>
                </div>
                {dimensions && (
                  <div>
                    <dt>解像度</dt>
                    <dd>
                      {dimensions.width}×{dimensions.height}
                    </dd>
                  </div>
                )}
                {media && (
                  <div>
                    <dt>長さ</dt>
                    <dd>{formatTimecode(media.duration)}</dd>
                  </div>
                )}
              </dl>

              <button className="disclosure" onClick={() => setDetailsOpen(!detailsOpen)}>
                {detailsOpen ? '▼' : '▶'} 詳細
              </button>
              {detailsOpen && (
                <dl className="source-facts source-facts-detail">
                  <div>
                    <dt>MIME</dt>
                    <dd>{file.type || 'unknown'}</dd>
                  </div>
                  {media?.videoCodec && (
                    <div>
                      <dt>映像</dt>
                      <dd>{media.videoCodec}</dd>
                    </div>
                  )}
                  {media?.audioCodec && (
                    <div>
                      <dt>音声</dt>
                      <dd>{media.audioCodec}</dd>
                    </div>
                  )}
                  {media?.tags?.title && (
                    <div>
                      <dt>タイトル</dt>
                      <dd>{media.tags.title}</dd>
                    </div>
                  )}
                  {media?.tags?.artist && (
                    <div>
                      <dt>作成者</dt>
                      <dd>{media.tags.artist}</dd>
                    </div>
                  )}
                  <div>
                    <dt>更新日時</dt>
                    <dd>{new Date(file.lastModified).toLocaleString()}</dd>
                  </div>
                </dl>
              )}
            </div>
          ) : batchFileCount > 0 ? (
            <div className="source">
              <div className="source-name">{batchFileCount} ファイルを一括変換</div>
            </div>
          ) : (
            <p className="step-empty">ファイルをドロップするか、下のボタンから選択します。</p>
          )}

          <div className="step-actions">
            <button className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
              ファイルを選択
            </button>
            <button className="ghost-btn" onClick={() => batchInputRef.current?.click()}>
              複数選択
            </button>
          </div>
        </Step>

        <Step index={2} title="出力形式">
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
          <p className="step-hint">
            {FORMATS.find((format) => format.value === settings.format)?.hint}
          </p>
        </Step>

        <Step index={3} title={settings.format === 'gif' ? 'フレームレート' : '画質'}>
          {settings.format === 'gif' ? (
            <div className="field">
              <div className="field-head">
                <span>FPS</span>
                <span className="field-value">{settings.fps ?? 10}</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.fps ?? 10}
                onChange={(e) => onSettingsChange({ ...settings, fps: Number(e.target.value) })}
              />
              <p className="step-hint">下げるほど軽くなり、上げるほど滑らかになります。</p>
            </div>
          ) : (
            <div className="field">
              <div className="field-head">
                <span>Quality</span>
                <span className="field-value">{settings.quality}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.quality}
                onChange={(e) => onSettingsChange({ ...settings, quality: Number(e.target.value) })}
              />
              <p className="step-hint">ビットレートの目安です。下げるとサイズが小さくなります。</p>
            </div>
          )}
        </Step>

        <Step index={4} title="解像度">
          {dimensions && (
            <div className="preset-row">
              <button
                className={`chip ${!settings.width && !settings.height ? 'active' : ''}`}
                onClick={() =>
                  onSettingsChange({ ...settings, width: undefined, height: undefined })
                }
              >
                原寸
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
              <span>幅</span>
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
            </label>
            <span className="dimension-times">×</span>
            <label className="dimension-field">
              <span>高さ</span>
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
            </label>
          </div>
        </Step>

        <Step index={5} title="出力の見込み">
          <div className="estimate">
            <div className="estimate-row">
              <span>推定サイズ</span>
              <strong>
                {previewEstimate.isEstimating
                  ? '計算中…'
                  : previewEstimate.estimatedSize > 0
                    ? formatBytes(previewEstimate.estimatedSize)
                    : '—'}
              </strong>
            </div>
            <div className="estimate-row">
              <span>長さ</span>
              <strong>{trimmedDuration > 0 ? formatTimecode(trimmedDuration) : '—'}</strong>
            </div>
          </div>

          {previewEstimate.estimatedSize > 0 ? (
            <CompatibilityList
              estimatedSize={previewEstimate.estimatedSize}
              duration={trimmedDuration}
            />
          ) : (
            <p className="step-hint">ファイルを選ぶと、投稿先ごとの上限と照らし合わせます。</p>
          )}
        </Step>

        <button className="link-btn" onClick={onResetSettings}>
          設定を初期値に戻す
        </button>
      </div>

      <div className="sidebar-footer">
        {converting ? (
          <>
            <div className="footer-progress">
              <div className="footer-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <button className="cancel-btn block" onClick={onCancel}>
              変換を中止（{progress}%）
            </button>
          </>
        ) : (
          <>
            {batchFileCount > 0 ? (
              <button className="convert-btn block" onClick={onBatchConvert}>
                {batchFileCount} ファイルを変換
              </button>
            ) : (
              <button className="convert-btn block" onClick={onConvert} disabled={!file}>
                {hasResult ? (stale ? '再変換する' : 'もう一度変換') : '変換する'}
              </button>
            )}
            {hasResult && (
              <button className="download-btn block" onClick={onDownload}>
                ダウンロード
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
