import { useRef, useCallback } from 'react'

interface FileUploadProps {
  file: File | null
  isDragging: boolean
  onFileSelect: (file: File) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function FileUpload({
  file,
  isDragging,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        onFileSelect(selectedFile)
      }
    },
    [onFileSelect]
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

      {!file && (
        <div
          className={`preview-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="drop-content">
            <div className="drop-message">Drop video file here</div>
            <button
              className="select-file-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
          </div>
        </div>
      )}
    </>
  )
}
