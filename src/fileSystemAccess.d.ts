// lib.dom.d.ts が未収録の File System Access API を補う宣言。
// どちらも一部のブラウザにしか存在しないため、省略可能なメンバーとして宣言する。

interface FileSystemPermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface Window {
  showDirectoryPicker?(options?: FileSystemPermissionDescriptor): Promise<FileSystemDirectoryHandle>
}

interface FileSystemHandle {
  requestPermission?(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>
}
