import { useCallback, useRef, useState } from 'react'
import './App.css'
import { BatchStatus } from './components/BatchStatus'
import { BottomBar } from './components/BottomBar'
import { FileUpload } from './components/FileUpload'
import { Sidebar } from './components/Sidebar'
import { VideoPreview } from './components/VideoPreview'
import { probeMedia } from './converters'
import { useBatchConversion } from './hooks/useBatchConversion'
import { useConversionJob } from './hooks/useConversionJob'
import { useSizeEstimate } from './hooks/useSizeEstimate'
import type { ConversionSettings, MediaInfo } from './types'

const DEFAULT_SETTINGS: ConversionSettings = {
  format: 'mp4',
  quality: 80,
}

/** 変換結果がいまの設定で作られたものかを比べるための鍵 */
function settingsKey(settings: ConversionSettings): string {
  return [
    settings.format,
    settings.quality,
    settings.width ?? '',
    settings.height ?? '',
    settings.fps ?? '',
    settings.startTime ?? '',
    settings.endTime ?? '',
  ].join('|')
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [media, setMedia] = useState<MediaInfo | null>(null)
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS)
  const [isDragging, setIsDragging] = useState(false)
  const [showAfter, setShowAfter] = useState(false)
  const [convertedKey, setConvertedKey] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const job = useConversionJob({ file, settings, media })
  const batch = useBatchConversion(settings)
  const previewEstimate = useSizeEstimate({ file, settings, media })

  // ファイル選択時に使う操作だけを取り出す（いずれも参照が安定している）
  const { reset: resetJob } = job
  const { clear: clearBatch, setFiles: setBatchFiles } = batch

  const converting = job.running || batch.running
  // 変換したあとに設定を触ったか。再変換ボタンで示す
  const stale = !!job.result && convertedKey !== settingsKey(settings)

  const handleConvert = async () => {
    // 変換できたら結果側に切り替える（その後の手動切り替えは妨げない）
    if (await job.convert()) {
      setConvertedKey(settingsKey(settings))
      setShowAfter(true)
    }
  }

  const selectFile = useCallback(
    async (selected: File) => {
      setFile(selected)
      setMedia(null)
      setShowAfter(false)
      setConvertedKey(null)
      resetJob()
      clearBatch()

      try {
        const info = await probeMedia(selected)
        setMedia(info)
        setSettings((prev) => ({ ...prev, startTime: 0, endTime: info.duration }))
      } catch (err) {
        console.error('Failed to get media information:', err)
      }
    },
    [resetJob, clearBatch]
  )

  const selectFiles = useCallback(
    (selected: File[]) => {
      setFile(null)
      setMedia(null)
      setShowAfter(false)
      setConvertedKey(null)
      resetJob()
      setBatchFiles(selected)
    },
    [resetJob, setBatchFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length === 1) {
        await selectFile(dropped[0])
      } else if (dropped.length > 1) {
        selectFiles(dropped)
      }
    },
    [selectFile, selectFiles]
  )

  const handleCancel = () => {
    if (batch.running) batch.cancel()
    else job.cancel()
  }

  // 尺に依存する切り出し区間は、いま開いているファイルに合わせて残す
  const handleResetSettings = () =>
    setSettings({ ...DEFAULT_SETTINGS, startTime: 0, endTime: media?.duration })

  return (
    <div className="app">
      <Sidebar
        file={file}
        media={media}
        batchFileCount={batch.files.length}
        settings={settings}
        onSettingsChange={setSettings}
        onFileSelect={selectFile}
        onFilesSelect={selectFiles}
        onResetSettings={handleResetSettings}
        previewEstimate={previewEstimate}
        converting={converting}
        progress={job.progress}
        hasResult={!!job.result}
        stale={stale}
        onConvert={handleConvert}
        onBatchConvert={batch.run}
        onCancel={handleCancel}
        onDownload={job.download}
      />

      <div className="workspace">
        <div className="stage">
          <FileUpload
            file={file}
            files={batch.files.map((item) => item.file)}
            isDragging={isDragging}
            onFileSelect={selectFile}
            onFilesSelect={selectFiles}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          {file && (
            <VideoPreview
              file={file}
              videoRef={videoRef}
              result={job.result}
              converting={job.running}
              progress={job.progress}
              showAfter={showAfter}
              error={job.error}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          )}

          {batch.files.length > 0 && (
            <div className="batch-area">
              {batch.error && <div className="batch-error">{batch.error}</div>}
              <BatchStatus files={batch.files} />
            </div>
          )}
        </div>

        {file && (
          <BottomBar
            file={file}
            videoRef={videoRef}
            duration={media?.duration ?? 0}
            settings={settings}
            onSettingsChange={setSettings}
            result={job.result}
            showAfter={showAfter}
            onToggleView={setShowAfter}
            converting={job.running}
            progress={job.progress}
            stale={stale}
            onConvert={handleConvert}
            onCancel={handleCancel}
            onDownload={job.download}
          />
        )}
      </div>
    </div>
  )
}

export default App
