import { ALL_FORMATS, BlobSource, Input } from 'mediabunny'
import type { MetadataTags } from 'mediabunny'
import type { MediaInfo } from '../types'

export async function probeMedia(file: File): Promise<MediaInfo> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })

  const [duration, videoTracks, audioTracks, tags] = await Promise.all([
    input.computeDuration(),
    input.getVideoTracks(),
    input.getAudioTracks(),
    readTags(input),
  ])

  const videoTrack = videoTracks[0]
  const audioTrack = audioTracks[0]

  return {
    duration,
    dimensions: videoTrack
      ? { width: videoTrack.displayWidth, height: videoTrack.displayHeight }
      : null,
    videoCodec: videoTrack?.codec ?? null,
    audioCodec: audioTrack?.codec ?? null,
    tags,
  }
}

/** タグは欠けていても支障がないので、読めなければ null にして他の情報を返す */
async function readTags(input: Input): Promise<MetadataTags | null> {
  try {
    return await input.getMetadataTags()
  } catch (err) {
    console.warn('Failed to get metadata tags:', err)
    return null
  }
}
