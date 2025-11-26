import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import {
  Input,
  ALL_FORMATS,
  BlobSource,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  WebMOutputFormat,
  Conversion,
} from 'mediabunny'
import type { ConversionSettings, ConversionResult, PreviewEstimate, BatchFileStatus } from './types'
import { ConversionControls } from './components/ConversionControls'
import { VideoPreview } from './components/VideoPreview'
import { FileUpload } from './components/FileUpload'
import { BatchStatus } from './components/BatchStatus'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [batchFiles, setBatchFiles] = useState<BatchFileStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    format: 'mp4',
    quality: 80,
  })
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string>('')
  const [mediaDuration, setMediaDuration] = useState<number | null>(null)
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null)
  const [videoCodec, setVideoCodec] = useState<string | null>(null)
  const [audioCodec, setAudioCodec] = useState<string | null>(null)
  const [metadataTags, setMetadataTags] = useState<any>(null)
  const [showAfter, setShowAfter] = useState(false)
  const [previewEstimate, setPreviewEstimate] = useState<PreviewEstimate>({ estimatedSize: 0, isEstimating: false })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentConversionRef = useRef<Conversion | null>(null)
  const previewTimeoutRef = useRef<number | null>(null)
  const outputDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setResult(null)
    setError('')
    setShowAfter(false)
    setVideoDimensions(null)
    setVideoCodec(null)
    setAudioCodec(null)
    setMetadataTags(null)

    try {
      const input = new Input({
        source: new BlobSource(selectedFile),
        formats: ALL_FORMATS,
      })
      const duration = await input.computeDuration()
      setMediaDuration(duration)

      setSettings((prev) => ({
        ...prev,
        startTime: 0,
        endTime: duration,
      }))

      // Get track information
      const videoTracks = await input.getVideoTracks()
      const audioTracks = await input.getAudioTracks()

      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0]
        setVideoDimensions({
          width: videoTrack.displayWidth,
          height: videoTrack.displayHeight
        })
        setVideoCodec(videoTrack.codec || null)
      }

      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0]
        setAudioCodec(audioTrack.codec || null)
      }

      // Get metadata tags
      try {
        const tags = await input.getMetadataTags()
        setMetadataTags(tags)
      } catch (err) {
        console.warn('Failed to get metadata tags:', err)
      }
    } catch (err) {
      console.error('Failed to get media information:', err)
    }
  }, [])

  const handleFilesSelect = useCallback((selectedFiles: File[]) => {
    setBatchFiles(
      selectedFiles.map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }))
    )
    setFile(null)
    setResult(null)
    setError('')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length === 1) {
        await processFile(droppedFiles[0])
      } else if (droppedFiles.length > 1) {
        handleFilesSelect(droppedFiles)
      }
    },
    [processFile, handleFilesSelect]
  )

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      await processFile(selectedFile)
    },
    [processFile]
  )

  const handleConvert = async () => {
    if (!file) return

    setConverting(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const source = new BlobSource(file)
      const input = new Input({
        source,
        formats: ALL_FORMATS,
      })

      const target = new BufferTarget()
      let outputFormat

      switch (settings.format) {
        case 'mp4':
          outputFormat = new Mp4OutputFormat()
          break
        case 'webm':
          outputFormat = new WebMOutputFormat()
          break
      }

      const output = new Output({
        target,
        format: outputFormat,
      })

      const conversionOptions: any = {
        input,
        output,
        video: {
          ...(settings.width && { width: settings.width }),
          ...(settings.height && { height: settings.height }),
          ...(settings.width && settings.height && { fit: 'contain' }),
          bitrate: Math.round((settings.quality / 100) * 5_000_000),
        },
      }

      // Add trim if start or end time is set
      if ((settings.startTime !== undefined && settings.startTime !== null) ||
          (settings.endTime !== undefined && settings.endTime !== null)) {
        conversionOptions.trim = {
          start: settings.startTime ?? 0,
          end: settings.endTime ?? mediaDuration ?? undefined,
        }
      }

      const conversion = await Conversion.init(conversionOptions)

      currentConversionRef.current = conversion

      if (!conversion.isValid) {
        throw new Error('Conversion is invalid: ' + JSON.stringify(conversion.discardedTracks))
      }

      conversion.onProgress = (prog) => {
        setProgress(Math.round(prog * 100))
      }

      await conversion.execute()

      setProgress(100)

      const buffer = target.buffer
      if (!buffer) {
        throw new Error('No buffer available after conversion')
      }

      const convertedSize = buffer.byteLength
      const originalSize = file.size

      const fileExtension = settings.format
      const filename = file.name.replace(/\.[^.]+$/, `.${fileExtension}`)

      setResult({
        buffer,
        originalSize,
        convertedSize,
        filename,
      })

      setShowAfter(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      console.error('Conversion error:', err)
    } finally {
      setConverting(false)
      currentConversionRef.current = null
    }
  }

  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result.buffer])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setSettings({
      format: 'mp4',
      quality: 80,
    })
  }

  const handleCancel = () => {
    if (currentConversionRef.current) {
      currentConversionRef.current.cancel()
      currentConversionRef.current = null
      setConverting(false)
      setProgress(0)
      setError('Conversion cancelled')
    }
  }

  const handleBatchConvert = async () => {
    if (batchFiles.length === 0) return

    // Request directory handle using File System Access API
    try {
      // Check if the browser supports the File System Access API
      if (!('showDirectoryPicker' in window)) {
        setError('File System Access API is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      const dirHandle = await (window as any).showDirectoryPicker()
      outputDirHandleRef.current = dirHandle

      // Request write permission upfront
      try {
        const permission = await dirHandle.requestPermission({ mode: 'readwrite' })
        if (permission !== 'granted') {
          setError('Write permission not granted for the selected folder')
          return
        }
      } catch (permError) {
        console.warn('Permission request not supported or failed:', permError)
        // Continue anyway as some browsers may not support requestPermission
      }

      setConverting(true)
      setError('')

      // Convert each file
      for (let i = 0; i < batchFiles.length; i++) {
        const fileStatus = batchFiles[i]
        
        // Update status to converting
        setBatchFiles(prev => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'converting', progress: 0 }
          return updated
        })

        try {
          const source = new BlobSource(fileStatus.file)
          const input = new Input({
            source,
            formats: ALL_FORMATS,
          })

          const target = new BufferTarget()
          let outputFormat

          switch (settings.format) {
            case 'mp4':
              outputFormat = new Mp4OutputFormat()
              break
            case 'webm':
              outputFormat = new WebMOutputFormat()
              break
          }

          const output = new Output({
            target,
            format: outputFormat,
          })

          const conversionOptions: any = {
            input,
            output,
            video: {
              ...(settings.width && { width: settings.width }),
              ...(settings.height && { height: settings.height }),
              ...(settings.width && settings.height && { fit: 'contain' }),
              bitrate: Math.round((settings.quality / 100) * 5_000_000),
            },
          }

          const conversion = await Conversion.init(conversionOptions)
          currentConversionRef.current = conversion

          if (!conversion.isValid) {
            throw new Error('Conversion is invalid: ' + JSON.stringify(conversion.discardedTracks))
          }

          conversion.onProgress = (prog) => {
            const progressPercent = Math.round(prog * 100)
            setBatchFiles(prev => {
              const updated = [...prev]
              updated[i] = { ...updated[i], progress: progressPercent }
              return updated
            })
          }

          await conversion.execute()

          const buffer = target.buffer
          if (!buffer) {
            throw new Error('No buffer available after conversion')
          }

          const convertedSize = buffer.byteLength
          const originalSize = fileStatus.file.size

          const fileExtension = settings.format
          const filename = fileStatus.file.name.replace(/\.[^.]+$/, `.${fileExtension}`)

          const conversionResult: ConversionResult = {
            buffer,
            originalSize,
            convertedSize,
            filename,
          }

          // Save file using File System Access API
          try {
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(buffer)
            await writable.close()
          } catch (saveError) {
            console.error('Error saving file:', saveError)
            throw new Error('Failed to save file to disk')
          }

          // Update status to completed
          setBatchFiles(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: 'completed',
              progress: 100,
              result: conversionResult,
            }
            return updated
          })
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Conversion failed'
          console.error('Conversion error for', fileStatus.file.name, ':', err)
          
          // Update status to error
          setBatchFiles(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: 'error',
              error: errorMessage,
            }
            return updated
          })
        } finally {
          currentConversionRef.current = null
        }
      }

      setConverting(false)
      setError('') // Clear error message after successful batch conversion
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError('Folder selection was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to select output folder')
      }
      setConverting(false)
      console.error('Batch conversion error:', err)
    }
  }

  const runPreviewEncode = useCallback(async (currentSettings: ConversionSettings) => {
    if (!file) return

    setPreviewEstimate({ estimatedSize: 0, isEstimating: true })

    try {
      const source = new BlobSource(file)
      const input = new Input({
        source,
        formats: ALL_FORMATS,
      })

      const target = new BufferTarget()
      let outputFormat

      switch (currentSettings.format) {
        case 'mp4':
          outputFormat = new Mp4OutputFormat()
          break
        case 'webm':
          outputFormat = new WebMOutputFormat()
          break
      }

      const output = new Output({
        target,
        format: outputFormat,
      })

      const conversionOptions: any = {
        input,
        output,
        video: {
          ...(currentSettings.width && { width: currentSettings.width }),
          ...(currentSettings.height && { height: currentSettings.height }),
          bitrate: Math.round((currentSettings.quality / 100) * 5_000_000),
        },
      }

      // Encode only 1 second for better accuracy
      const previewDuration = 1.0
      conversionOptions.trim = {
        start: currentSettings.startTime ?? 0,
        end: (currentSettings.startTime ?? 0) + previewDuration,
      }

      const conversion = await Conversion.init(conversionOptions)

      if (!conversion.isValid) {
        console.warn('Preview conversion is invalid')
        setPreviewEstimate({ estimatedSize: 0, isEstimating: false })
        return
      }

      await conversion.execute()

      const buffer = target.buffer
      if (!buffer) {
        setPreviewEstimate({ estimatedSize: 0, isEstimating: false })
        return
      }

      const previewSize = buffer.byteLength
      const duration = (currentSettings.endTime ?? mediaDuration ?? 0) - (currentSettings.startTime ?? 0)

      // Estimate full size based on preview sample
      const estimatedFullSize = Math.round((previewSize / previewDuration) * duration)

      setPreviewEstimate({ estimatedSize: estimatedFullSize, isEstimating: false })
    } catch (err) {
      console.error('Preview encode error:', err)
      setPreviewEstimate({ estimatedSize: 0, isEstimating: false })
    }
  }, [file, mediaDuration])

  // Debounced preview encode
  useEffect(() => {
    if (!file) return

    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    // Set new timeout for 500ms debounce
    previewTimeoutRef.current = setTimeout(() => {
      runPreviewEncode(settings)
    }, 500)

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [settings, file, runPreviewEncode])

  const isVideo = file?.type.startsWith('video/')

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
        onConvert={handleConvert}
        onBatchConvert={handleBatchConvert}
        onReset={handleReset}
        onDownload={handleDownload}
        onCancel={handleCancel}
        converting={converting}
        progress={progress}
        hasResult={!!result}
        isVideo={!!isVideo}
        mediaDuration={mediaDuration}
        previewEstimate={previewEstimate}
        hasFile={!!file}
        hasBatchFiles={batchFiles.length > 0}
      />

      <FileUpload
        file={file}
        files={batchFiles.map(f => f.file)}
        isDragging={isDragging}
        onFileSelect={handleFileSelect}
        onFilesSelect={handleFilesSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {batchFiles.length > 0 && <BatchStatus files={batchFiles} />}

      {file && (
        <VideoPreview
          file={file}
          result={result}
          converting={converting}
          progress={progress}
          showAfter={showAfter}
          onToggleView={setShowAfter}
          error={error}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          mediaDuration={mediaDuration}
          videoDimensions={videoDimensions}
          videoCodec={videoCodec}
          audioCodec={audioCodec}
          metadataTags={metadataTags}
          onFileSelect={() => fileInputRef.current?.click()}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0]
          if (selectedFile) {
            handleFileSelect(selectedFile)
          }
        }}
        accept="video/*"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default App
