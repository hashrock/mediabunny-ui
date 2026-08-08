const UNITS = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${Math.round(value * 100) / 100} ${UNITS[exponent]}`
}

/** 秒数を hh:mm:ss 形式にする */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function replaceExtension(filename: string, extension: string): string {
  return filename.replace(/\.[^.]+$/, `.${extension}`)
}
