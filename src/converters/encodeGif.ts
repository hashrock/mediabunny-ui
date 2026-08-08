import GIF from 'gif.js'
import { createAbortError, throwIfAborted } from '../utils/abort'
import { replaceExtension } from '../utils/format'
import type { EncodeOptions, EncodedResult } from './types'

export const DEFAULT_GIF_FPS = 10

const GIF_WORKERS = 2
const GIF_QUALITY = 10
const GIF_WORKER_SCRIPT = '/gif.worker.js'
/** 全体の進捗のうちフレーム抽出が占める割合。残りは GIF のエンコードに使う */
const FRAME_EXTRACTION_SHARE = 0.8

/**
 * video 要素からフレームを 1 枚ずつ取り出して GIF に組み立てる。
 * mediabunny は GIF 出力に対応していないため、この経路だけ canvas を使う。
 */
export async function encodeGif({
  file,
  settings,
  trim,
  signal,
  onProgress,
}: EncodeOptions): Promise<EncodedResult> {
  throwIfAborted(signal)

  const video = document.createElement('video')
  const objectUrl = URL.createObjectURL(file)
  video.src = objectUrl
  video.muted = true
  video.playsInline = true

  let gif: GIF | null = null

  try {
    await waitForMetadata(video, signal)

    const start = trim?.start ?? 0
    const end = trim?.end ?? video.duration
    const fps = settings.fps ?? DEFAULT_GIF_FPS
    const width = settings.width ?? video.videoWidth
    const height = settings.height ?? video.videoHeight
    const totalFrames = Math.max(1, Math.ceil((end - start) * fps))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to create a 2D canvas context')
    }

    gif = new GIF({
      workers: GIF_WORKERS,
      quality: GIF_QUALITY,
      width,
      height,
      workerScript: GIF_WORKER_SCRIPT,
    })

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = start + frame / fps
      if (time > end) break

      await seek(video, time, signal)
      context.drawImage(video, 0, 0, width, height)
      gif.addFrame(context, { copy: true, delay: 1000 / fps })

      onProgress?.((frame / totalFrames) * FRAME_EXTRACTION_SHARE)
    }

    const blob = await render(gif, signal, onProgress)
    const buffer = await blob.arrayBuffer()

    onProgress?.(1)
    return { buffer, filename: replaceExtension(file.name, 'gif') }
  } catch (err) {
    gif?.abort()
    throw err
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function waitForMetadata(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.onloadedmetadata = null
      video.onerror = null
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }

    video.onloadedmetadata = () => {
      cleanup()
      resolve()
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) onAbort()
  })
}

function seek(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.onseeked = null
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }

    video.onseeked = () => {
      cleanup()
      resolve()
    }

    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) {
      onAbort()
      return
    }

    video.currentTime = time
  })
}

function render(
  gif: GIF,
  signal: AbortSignal | undefined,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(createAbortError())

    gif.on('finished', (blob) => {
      signal?.removeEventListener('abort', onAbort)
      resolve(blob)
    })
    gif.on('progress', (progress) => {
      onProgress?.(FRAME_EXTRACTION_SHARE + progress * (1 - FRAME_EXTRACTION_SHARE))
    })

    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) {
      onAbort()
      return
    }

    gif.render()
  })
}
