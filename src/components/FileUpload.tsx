import { useRef, useCallback } from 'react'

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

  return (
    <>
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

      {!file && files.length === 0 && (
        <div
          className={`preview-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="drop-content">
            <div className="drop-message">Drop video file(s) here</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="select-file-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </button>
              <button
                className="select-file-btn"
                onClick={() => batchFileInputRef.current?.click()}
              >
                Select Multiple Files
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
