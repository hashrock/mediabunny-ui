import { useCallback, useEffect, useRef, useState } from 'react'

interface TimelineProps {
  duration: number
  start: number
  end: number
  currentTime: number
  onTrimChange: (trim: { start: number; end: number }) => void
  onSeek: (time: number) => void
}

type DragTarget = 'start' | 'end' | 'playhead'

/** これ以上は詰められない区間の長さ（秒） */
const MIN_RANGE = 0.1

const percent = (value: number, duration: number) =>
  duration > 0 ? `${(value / duration) * 100}%` : '0%'

/**
 * トリム区間と再生位置をドラッグで操作するタイムライン。
 * ハンドルを動かすと再生位置もそこへ飛ぶので、切り出し位置をその場で確認できる。
 */
export function Timeline({
  duration,
  start,
  end,
  currentTime,
  onTrimChange,
  onSeek,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<DragTarget | null>(null)

  const timeAt = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return 0
      const ratio = (clientX - rect.left) / rect.width
      return Math.min(duration, Math.max(0, ratio * duration))
    },
    [duration]
  )

  const applyDrag = useCallback(
    (target: DragTarget, time: number) => {
      if (target === 'playhead') {
        onSeek(time)
        return
      }
      if (target === 'start') {
        const next = Math.min(time, end - MIN_RANGE)
        onTrimChange({ start: Math.max(0, next), end })
        onSeek(Math.max(0, next))
        return
      }
      const next = Math.max(time, start + MIN_RANGE)
      onTrimChange({ start, end: Math.min(duration, next) })
      onSeek(Math.min(duration, next))
    },
    [duration, start, end, onTrimChange, onSeek]
  )

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: PointerEvent) => applyDrag(dragging, timeAt(e.clientX))
    const onUp = () => setDragging(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, applyDrag, timeAt])

  const beginDrag = (target: DragTarget) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(target)
  }

  return (
    <div
      ref={trackRef}
      className={`timeline ${dragging ? 'dragging' : ''}`}
      onPointerDown={(e) => {
        setDragging('playhead')
        onSeek(timeAt(e.clientX))
      }}
    >
      <div className="timeline-track">
        <div
          className="timeline-range"
          style={{ left: percent(start, duration), width: percent(end - start, duration) }}
          onPointerDown={beginDrag('playhead')}
        />
        <div
          className="timeline-handle timeline-handle-start"
          style={{ left: percent(start, duration) }}
          onPointerDown={beginDrag('start')}
          role="slider"
          aria-label="Trim start"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={start}
          tabIndex={0}
        />
        <div
          className="timeline-handle timeline-handle-end"
          style={{ left: percent(end, duration) }}
          onPointerDown={beginDrag('end')}
          role="slider"
          aria-label="Trim end"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={end}
          tabIndex={0}
        />
        <div
          className="timeline-playhead"
          style={{ left: percent(currentTime, duration) }}
          onPointerDown={beginDrag('playhead')}
        />
      </div>
    </div>
  )
}
