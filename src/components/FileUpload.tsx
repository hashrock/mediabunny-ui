import { useRef, useCallback } from 'react'
import { useI18n } from '../i18n/context'

interface FileUploadProps {
  file: File | null
  files: File[]
  isDragging: boolean
  onFileSelect: (file: File) => void
  onFilesSelect: (files: File[]) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

/** 何も読み込んでいないときのドロップ領域 */
export function FileUpload({
  file,
  files,
  isDragging,
  onFileSelect,
  onFilesSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileUploadProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        onFileSelect(selectedFile)
      }
    },
    [onFileSelect]
  )

  const handleBatchFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        onFilesSelect(Array.from(selectedFiles))
      }
    },
    [onFilesSelect]
  )

  if (file || files.length > 0) return null

  return (
    <div
      className={`preview-area drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="video/*"
        style={{ display: 'none' }}
      />
      <input
        ref={batchFileInputRef}
        type="file"
        onChange={handleBatchFileChange}
        accept="video/*"
        multiple
        style={{ display: 'none' }}
      />

      <div className="drop-content">
        <div className="drop-message">{t.dropHere}</div>
        <div className="drop-actions">
          <button className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
            {t.selectFile}
          </button>
          <button className="ghost-btn" onClick={() => batchFileInputRef.current?.click()}>
            {t.selectFiles}
          </button>
        </div>
      </div>
    </div>
  )
}
