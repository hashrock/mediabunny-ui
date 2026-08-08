import { encodeGif } from './encodeGif'
import { encodeMedia } from './encodeMedia'
import type { EncodeOptions, EncodedResult } from './types'

/** 出力フォーマットに応じたエンコーダに振り分ける */
export function encode(options: EncodeOptions): Promise<EncodedResult> {
  return options.settings.format === 'gif' ? encodeGif(options) : encodeMedia(options)
}

export { DEFAULT_GIF_FPS } from './encodeGif'
export { estimateOutputSize } from './estimate'
export { probeMedia } from './probe'
export { toTrim } from './trim'
export { toConversionResult } from './types'
export type { EncodeOptions, EncodedResult } from './types'
