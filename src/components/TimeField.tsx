import { useState } from 'react'
import { formatTimecode, parseTimecode } from '../utils/format'

interface TimeFieldProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/**
 * mm:ss.s で時刻を編集する入力欄。
 * 打ち込んでいる途中の値を確定させないよう、反映は Enter と blur のときだけ行う。
 * 編集していない間は外からの値（タイムラインのドラッグなど）をそのまま映す。
 */
export function TimeField({ label, value, min, max, onChange }: TimeFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? formatTimecode(value)

  const commit = () => {
    if (draft === null) return
    setDraft(null)

    const parsed = parseTimecode(draft)
    if (parsed === null) return
    onChange(Math.min(max, Math.max(min, parsed)))
  }

  return (
    <label className="time-field">
      <span className="time-field-label">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => setDraft(formatTimecode(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          // 取り消しは blur を挟まず戻す（blur させると編集中の値を確定してしまう）
          if (e.key === 'Escape') setDraft(null)
        }}
      />
    </label>
  )
}
