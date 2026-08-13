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

/** 秒数を mm:ss.s（1時間以上なら h:mm:ss.s）形式にする。トリム入力の表示用 */
export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = clamped % 60
  const ss = s.toFixed(1).padStart(4, '0')
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${ss}`
    : `${String(m).padStart(2, '0')}:${ss}`
}

/** formatTimecode の逆。`ss` `mm:ss` `h:mm:ss` を受け付け、解釈できなければ null */
export function parseTimecode(text: string): number | null {
  const parts = text.trim().split(':')
  if (parts.length > 3) return null

  let seconds = 0
  for (const part of parts) {
    if (!/^\d*\.?\d*$/.test(part) || part === '') return null
    seconds = seconds * 60 + Number(part)
  }
  return Number.isFinite(seconds) ? seconds : null
}

export function replaceExtension(filename: string, extension: string): string {
  return filename.replace(/\.[^.]+$/, `.${extension}`)
}
