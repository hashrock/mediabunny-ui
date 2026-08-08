/** 出力先フォルダをユーザーに選ばせ、書き込み権限まで確保して返す */
export async function pickOutputDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) {
    throw new Error(
      'File System Access API is not supported in this browser. Please use Chrome or Edge.'
    )
  }

  const directory = await window.showDirectoryPicker({ mode: 'readwrite' })

  // requestPermission を持たないブラウザもあるため、あるときだけ事前に確認する
  if (directory.requestPermission) {
    const permission = await directory.requestPermission({ mode: 'readwrite' })
    if (permission !== 'granted') {
      throw new Error('Write permission not granted for the selected folder')
    }
  }

  return directory
}

export async function writeFileToDirectory(
  directory: FileSystemDirectoryHandle,
  filename: string,
  buffer: ArrayBuffer
): Promise<void> {
  try {
    const fileHandle = await directory.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(buffer)
    await writable.close()
  } catch (err) {
    console.error('Error saving file:', err)
    throw new Error(`Failed to save ${filename} to disk`, { cause: err })
  }
}
