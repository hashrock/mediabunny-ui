export type Lang = 'ja' | 'en'

export const LANGS: Lang[] = ['ja', 'en']

/** 日本語を正とし、英語はこの形に合わせる（欠けた文言は型エラーになる） */
const ja = {
  langLabel: { ja: '日本語', en: 'English' },

  // Steps
  stepInput: '入力',
  stepFormat: '出力形式',
  stepQuality: '画質',
  stepFps: 'フレームレート',
  stepResolution: '解像度',
  stepEstimate: '出力の見込み',

  // Input
  inputEmpty: 'ファイルをドロップするか、下のボタンから選択します。',
  selectFile: 'ファイルを選択',
  selectFiles: '複数選択',
  batchSelected: (count: number) => `${count} ファイルを一括変換`,
  details: '詳細',
  factSize: 'サイズ',
  factResolution: '解像度',
  factDuration: '長さ',
  factMime: 'MIME',
  factVideoCodec: '映像',
  factAudioCodec: '音声',
  factTitle: 'タイトル',
  factArtist: '作成者',
  factModified: '更新日時',

  // Format
  formatHintMp4: 'H.264 / 汎用',
  formatHintWebm: 'VP9 / Web 向け',
  formatHintGif: 'ループ画像',

  // Quality / FPS
  qualityLabel: 'Quality',
  qualityHint: 'ビットレートの目安です。下げるとサイズが小さくなります。',
  fpsLabel: 'FPS',
  fpsHint: '下げるほど軽くなり、上げるほど滑らかになります。',

  // Resolution
  originalSize: '原寸',
  width: '幅',
  height: '高さ',
  auto: 'Auto',

  // Estimate
  estimatedSize: '推定サイズ',
  outputDuration: '長さ',
  estimating: '計算中…',
  estimateEmpty: 'ファイルを選ぶと、投稿先ごとの上限と照らし合わせます。',
  compatTitle: '投稿先チェック',
  compatExceeded: '上限超過',

  // Sidebar actions
  resetSettings: '設定を初期値に戻す',
  convert: '変換する',
  convertAgain: 'もう一度変換',
  reconvertLong: '再変換する',
  cancelWithProgress: (progress: number) => `変換を中止（${progress}%）`,
  download: 'ダウンロード',
  convertBatch: (count: number) => `${count} ファイルを変換`,

  // Bottom bar
  play: '再生',
  pause: '一時停止',
  trimmedLength: '切り出す長さ',
  trimIn: 'IN',
  trimOut: 'OUT',
  setInToPlayhead: '⇤ 現在位置',
  setOutToPlayhead: '現在位置 ⇥',
  setInTitle: '開始位置を再生位置に合わせる',
  setOutTitle: '終了位置を再生位置に合わせる',
  wholeClip: '全体',
  wholeClipTitle: '全体を対象にする',
  trimStartHandle: '開始位置',
  trimEndHandle: '終了位置',
  before: '変換前',
  after: '変換後',
  reconvert: '再変換',
  reconvertTitle: 'もう一度変換する',
  reconvertTitleStale: '前回の変換のあとで設定が変わっています',
  cancel: '中止',

  // Drop zone
  dropHere: '動画ファイルをここにドロップ',

  // Errors（アプリが出すもの。エンコーダ由来の例外はそのまま表示する）
  errorCancelled: '変換を中止しました',
  errorConversionFailed: '変換に失敗しました',
  errorFolderCancelled: '保存先の選択を中止しました',
  errorFolderFailed: '保存先フォルダを選べませんでした',

  // Batch
  batchStatus: (completed: number, total: number, errors: number) =>
    `一括変換 ${completed}/${total} 完了${errors > 0 ? `、エラー ${errors}` : ''}`,

  // Preview
  convertedGifAlt: '変換後の GIF',
}

export type Messages = typeof ja

const en: Messages = {
  langLabel: { ja: '日本語', en: 'English' },

  stepInput: 'Input',
  stepFormat: 'Format',
  stepQuality: 'Quality',
  stepFps: 'Frame rate',
  stepResolution: 'Resolution',
  stepEstimate: 'Estimate',

  inputEmpty: 'Drop a file here, or pick one with the buttons below.',
  selectFile: 'Select file',
  selectFiles: 'Select multiple',
  batchSelected: (count: number) => `${count} files queued for batch conversion`,
  details: 'Details',
  factSize: 'Size',
  factResolution: 'Resolution',
  factDuration: 'Duration',
  factMime: 'MIME',
  factVideoCodec: 'Video',
  factAudioCodec: 'Audio',
  factTitle: 'Title',
  factArtist: 'Artist',
  factModified: 'Modified',

  formatHintMp4: 'H.264 / general purpose',
  formatHintWebm: 'VP9 / for the web',
  formatHintGif: 'Looping image',

  qualityLabel: 'Quality',
  qualityHint: 'Approximate bitrate. Lower it to shrink the output.',
  fpsLabel: 'FPS',
  fpsHint: 'Lower is lighter, higher is smoother.',

  originalSize: 'Original',
  width: 'Width',
  height: 'Height',
  auto: 'Auto',

  estimatedSize: 'Estimated size',
  outputDuration: 'Duration',
  estimating: 'Calculating…',
  estimateEmpty: 'Pick a file to check it against each service limit.',
  compatTitle: 'Upload targets',
  compatExceeded: 'Over limit',

  resetSettings: 'Reset settings',
  convert: 'Convert',
  convertAgain: 'Convert again',
  reconvertLong: 'Re-convert',
  cancelWithProgress: (progress: number) => `Cancel (${progress}%)`,
  download: 'Download',
  convertBatch: (count: number) => `Convert ${count} files`,

  play: 'Play',
  pause: 'Pause',
  trimmedLength: 'Trimmed length',
  trimIn: 'In',
  trimOut: 'Out',
  setInToPlayhead: '⇤ Playhead',
  setOutToPlayhead: 'Playhead ⇥',
  setInTitle: 'Set trim start to the current position',
  setOutTitle: 'Set trim end to the current position',
  wholeClip: 'Whole',
  wholeClipTitle: 'Use the whole clip',
  trimStartHandle: 'Trim start',
  trimEndHandle: 'Trim end',
  before: 'Before',
  after: 'After',
  reconvert: 'Re-convert',
  reconvertTitle: 'Convert again',
  reconvertTitleStale: 'Settings changed since the last conversion',
  cancel: 'Cancel',

  dropHere: 'Drop a video file here',

  errorCancelled: 'Conversion cancelled',
  errorConversionFailed: 'Conversion failed',
  errorFolderCancelled: 'Folder selection was cancelled',
  errorFolderFailed: 'Failed to select output folder',

  batchStatus: (completed: number, total: number, errors: number) =>
    `Batch conversion ${completed}/${total} completed${errors > 0 ? `, ${errors} errors` : ''}`,

  convertedGifAlt: 'Converted GIF',
}

export const messages: Record<Lang, Messages> = { ja, en }

export const STORAGE_KEY = 'mediabunny-ui.lang'

/** 保存された選択 → ブラウザの言語 の順に決める */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ja' || saved === 'en') return saved
  } catch {
    // プライベートモードなどで localStorage を読めないときはブラウザの言語に従う
  }
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}
