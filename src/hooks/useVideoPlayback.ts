import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Trim } from '../types'

interface UseVideoPlaybackOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  /** 再生対象。差し替わったら再生位置の購読を張り直す */
  file: File | null
  /** 再生を閉じ込める区間。null なら全体を再生する */
  trim: Trim | null
}

export interface VideoPlayback {
  currentTime: number
  playing: boolean
  seek: (time: number) => void
  toggle: () => void
}

/**
 * プレビュー動画の再生位置を購読し、トリム区間の中でループさせる。
 * 区間を調整しながら結果を確かめる操作を、再生し直さずに続けられる。
 */
export function useVideoPlayback({
  videoRef,
  file,
  trim,
}: UseVideoPlaybackOptions): VideoPlayback {
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  const start = trim?.start ?? 0
  const end = trim?.end ?? Infinity

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      // 区間の終わりまで来たら頭に戻す（境界の揺れで抜けないよう少し手前で判定）
      if (video.currentTime >= end - 0.02 && end !== Infinity) {
        video.currentTime = start
        setCurrentTime(start)
        return
      }
      setCurrentTime(video.currentTime)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    // 読み込み直しでは前のファイルの再生位置を持ち越さない
    const onLoad = () => {
      setCurrentTime(video.currentTime)
      setPlaying(!video.paused)
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('seeked', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('loadedmetadata', onLoad)
    video.addEventListener('emptied', onLoad)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('seeked', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('loadedmetadata', onLoad)
      video.removeEventListener('emptied', onLoad)
    }
  }, [videoRef, file, start, end])

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video) return
      video.currentTime = time
      setCurrentTime(time)
    },
    [videoRef]
  )

  const toggle = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      // 区間の外から再生し始めると意図しない場所が流れるので頭に戻す
      if (video.currentTime < start || video.currentTime >= end - 0.02) {
        video.currentTime = start
      }
      void video.play()
    } else {
      video.pause()
    }
  }, [videoRef, start, end])

  return { currentTime, playing, seek, toggle }
}
