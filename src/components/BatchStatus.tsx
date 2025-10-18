import type { BatchFileStatus } from '../types'

interface BatchStatusProps {
  files: BatchFileStatus[]
}

export function BatchStatus({ files }: BatchStatusProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = (status: BatchFileStatus['status']) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'converting':
        return '🔄'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
    }
  }

  const getStatusColor = (status: BatchFileStatus['status']) => {
    switch (status) {
      case 'pending':
        return '#666'
      case 'converting':
        return '#007bff'
      case 'completed':
        return '#28a745'
      case 'error':
        return '#dc3545'
    }
  }

  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>
        Batch Conversion Status ({completedCount}/{files.length} completed
        {errorCount > 0 && `, ${errorCount} errors`})
      </h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {files.map((fileStatus, index) => (
          <div
            key={index}
            style={{
              padding: '10px',
              marginBottom: '8px',
              border: '1px solid #eee',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{getStatusIcon(fileStatus.status)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {fileStatus.file.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatSize(fileStatus.file.size)}
                </div>
              </div>
              <div style={{ color: getStatusColor(fileStatus.status), fontWeight: 'bold' }}>
                {fileStatus.status === 'converting' && `${fileStatus.progress}%`}
                {fileStatus.status === 'completed' && fileStatus.result && (
                  <span style={{ fontSize: '12px' }}>
                    → {formatSize(fileStatus.result.convertedSize)}
                  </span>
                )}
              </div>
            </div>
            {fileStatus.status === 'converting' && (
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    height: '4px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#007bff',
                      width: `${fileStatus.progress}%`,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            )}
            {fileStatus.error && (
              <div style={{ marginTop: '8px', color: '#dc3545', fontSize: '12px' }}>
                {fileStatus.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
