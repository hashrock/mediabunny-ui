export function downloadBuffer(buffer: ArrayBuffer, filename: string): void {
  const url = URL.createObjectURL(new Blob([buffer]))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
