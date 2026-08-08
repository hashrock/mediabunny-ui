import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
} from 'mediabunny'
import type { ConversionOptions } from 'mediabunny'
import { throwIfAborted } from '../utils/abort'
import { replaceExtension } from '../utils/format'
import type { EncodeOptions, EncodedResult } from './types'

/** quality 100% のときのビットレート */
const MAX_VIDEO_BITRATE = 5_000_000

/** mediabunny を使って MP4 / WebM にエンコードする */
export async function encodeMedia({
  file,
  settings,
  trim,
  signal,
  onProgress,
}: EncodeOptions): Promise<EncodedResult> {
  throwIfAborted(signal)

  const target = new BufferTarget()
  const options: ConversionOptions = {
    input: new Input({ source: new BlobSource(file), formats: ALL_FORMATS }),
    output: new Output({
      target,
      format: settings.format === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat(),
    }),
    video: {
      ...(settings.width && { width: settings.width }),
      ...(settings.height && { height: settings.height }),
      ...(settings.width && settings.height && { fit: 'contain' as const }),
      bitrate: Math.round((settings.quality / 100) * MAX_VIDEO_BITRATE),
    },
    ...(trim && { trim }),
  }

  const conversion = await Conversion.init(options)
  if (!conversion.isValid) {
    throw new Error('Conversion is invalid: ' + JSON.stringify(conversion.discardedTracks))
  }

  const cancel = () => void conversion.cancel()
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    conversion.onProgress = (progress) => onProgress?.(progress)
    await conversion.execute()
    // cancel() 後も execute() は正常に解決しうるので、ここで中断を確定させる
    throwIfAborted(signal)
  } finally {
    signal?.removeEventListener('abort', cancel)
  }

  const buffer = target.buffer
  if (!buffer) {
    throw new Error('No buffer available after conversion')
  }

  onProgress?.(1)
  return { buffer, filename: replaceExtension(file.name, settings.format) }
}
