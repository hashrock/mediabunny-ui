# Batch Conversion Feature

## Overview

This application now supports batch conversion of multiple video files using the File System Access API. Users can select multiple video files and convert them all at once, with the converted files automatically saved to a selected output folder.

## Features

### Multiple File Selection
- Users can click "Select Multiple Files" to choose multiple video files at once
- Alternatively, users can drag and drop multiple files into the drop zone
- All selected files are queued for batch conversion

### File System Access API Integration
- When starting a batch conversion, users are prompted to select an output folder
- Converted files are automatically saved to the selected folder
- No need to manually download each file
- **Browser Support**: Chrome and Edge (File System Access API required)

### Batch Conversion Status
- Real-time progress tracking for each file in the batch
- Visual indicators showing the status of each file:
  - ⏳ Pending - File is waiting to be processed
  - 🔄 Converting - File is currently being converted (with progress bar)
  - ✅ Completed - File has been successfully converted
  - ❌ Error - File conversion failed
- Summary showing completed count and any errors
- Individual progress bars for each file being converted

### Conversion Settings
- All files in a batch use the same conversion settings:
  - Format (MP4 or WebM)
  - Quality (1-100%)
  - Width and Height (optional)
- Settings can be adjusted before starting the batch conversion

## Usage

1. **Select Multiple Files**:
   - Click "Select Multiple Files" button, or
   - Drag and drop multiple video files into the drop zone

2. **Configure Settings**:
   - Choose output format (MP4 or WebM)
   - Adjust quality slider
   - Optionally set width/height

3. **Start Batch Conversion**:
   - Click "Batch Convert" button
   - Select an output folder when prompted
   - Wait for all conversions to complete

4. **Monitor Progress**:
   - Watch the batch status panel for real-time updates
   - See which files are being processed
   - Identify any files that failed to convert

## Technical Details

### File System Access API
The application uses the modern File System Access API to write files directly to a user-selected directory:

```javascript
// Request directory access
const dirHandle = await window.showDirectoryPicker()

// Save converted file
const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
const writable = await fileHandle.createWritable()
await writable.write(buffer)
await writable.close()
```

### Browser Compatibility
- ✅ Chrome 86+
- ✅ Edge 86+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

The application will show an error message if the browser doesn't support the File System Access API.

## Single File Mode

The original single-file conversion mode is still available:
- Click "Select File" to convert one file at a time
- Use the "Download" button to save the converted file
- Works in all browsers

## Future Enhancements

Potential improvements for future versions:
- Parallel processing of multiple files
- Custom settings per file
- Resume failed conversions
- Export/import batch conversion profiles
