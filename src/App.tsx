import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { BatchStatus } from './components/BatchStatus'
import { ConversionControls } from './components/ConversionControls'
import { FileUpload } from './components/FileUpload'
import { UploadCompatibilityPanel } from './components/UploadCompatibilityPanel'
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

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [media, setMedia] = useState<MediaInfo | null>(null)
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS)
  const [isDragging, setIsDragging] = useState(false)
  const [showAfter, setShowAfter] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const job = useConversionJob({ file, settings, media })
  const batch = useBatchConversion(settings)
  const previewEstimate = useSizeEstimate({ file, settings, media })

  // ファイル選択時に使う操作だけを取り出す（いずれも参照が安定している）
  const { reset: resetJob } = job
  const { clear: clearBatch, setFiles: setBatchFiles } = batch

  const converting = job.running || batch.running

  // 変換が終わったら結果側の表示に切り替える（その後の手動切り替えは妨げない）
  useEffect(() => {
    if (job.state.kind === 'done') setShowAfter(true)
  }, [job.state.kind])

  const selectFile = useCallback(
    async (selected: File) => {
      setFile(selected)
      setMedia(null)
      setShowAfter(false)
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

  const handleReset = () => setSettings(DEFAULT_SETTINGS)

  const isVideo = file?.type.startsWith('video/') ?? false

  return (
    <div className="app">
      <div className="file-header">
        <div className="file-header-content">
          <div className="logo">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.6018 86.2478C2.00431 94.9039 6.19952 53.9469 23.7246 50.4125C32.6017 48.6222 14.5781 14.1139 32.1539 13.0413C46.2146 12.1833 36.3339 44.8067 48.6748 46.0905C61.0157 47.3744 46.8788 10.5945 64.7008 11.9515C82.5229 13.3084 68.4816 44.7593 76.8022 52.4154C97 71.0001 71.7956 98.756 61 86.2478C53.3734 77.4113 69 57.5 87 93" stroke="#8E6F70" strokeWidth="9" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="filename">{file ? file.name : 'No file selected'}</span>
          <button className="select-file-btn" onClick={() => fileInputRef.current?.click()}>
            Select File
          </button>
        </div>
      </div>

      <ConversionControls
        settings={settings}
        onSettingsChange={setSettings}
        onConvert={job.convert}
        onBatchConvert={batch.run}
        onReset={handleReset}
        onDownload={job.download}
        onCancel={handleCancel}
        converting={converting}
        progress={job.progress}
        hasResult={!!job.result}
        isVideo={isVideo}
        mediaDuration={media?.duration ?? null}
        previewEstimate={previewEstimate}
        hasFile={!!file}
        hasBatchFiles={batch.files.length > 0}
      />

      <div className="app-body">
        <div className="main-content">
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

          {batch.error && <div className="error-message">{batch.error}</div>}
          {batch.files.length > 0 && <BatchStatus files={batch.files} />}

          {file && (
            <VideoPreview
              file={file}
              media={media}
              result={job.result}
              converting={job.running}
              progress={job.progress}
              showAfter={showAfter}
              onToggleView={setShowAfter}
              error={job.error}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          )}
        </div>

        <UploadCompatibilityPanel
          previewEstimate={previewEstimate}
          settings={settings}
          mediaDuration={media?.duration ?? null}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => {
          const selected = e.target.files?.[0]
          if (selected) selectFile(selected)
        }}
        accept="video/*"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default App
