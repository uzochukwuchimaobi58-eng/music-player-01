import { get, set } from 'idb-keyval';
import { Track } from '../types';
import { parseAudioMetadata } from './metadataParser';
import { storeAudioBlobOffline, getAudioBlobOffline } from './storage';

export interface ScanProgressCallback {
  (current: number, total: number, currentFileName: string): void;
}

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|m4a|aac|opus|wma)$/i;
const DIRECTORY_HANDLE_KEY = 'saved_phone_music_dir_handle';

/**
 * Check if the browser supports the modern File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Save directory handle in IndexedDB for 0-click automated future scans
 */
export async function saveDirectoryHandle(handle: any): Promise<void> {
  try {
    await set(DIRECTORY_HANDLE_KEY, handle);
  } catch (err) {
    console.debug('Failed to persist directory handle:', err);
  }
}

/**
 * Get saved directory handle from IndexedDB
 */
export async function getSavedDirectoryHandle(): Promise<any | null> {
  try {
    return await get(DIRECTORY_HANDLE_KEY);
  } catch (err) {
    console.debug('Failed to get saved directory handle:', err);
    return null;
  }
}

/**
 * Automatically scan stored directory handle on startup without any user clicks
 */
export async function autoScanStoredDirectory(
  onProgress?: ScanProgressCallback
): Promise<Track[]> {
  try {
    const handle = await getSavedDirectoryHandle();
    if (!handle) return [];

    // Verify permission
    if (handle.queryPermission) {
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        return [];
      }
    }

    const audioFiles: { file: File; relativePath: string; folder: string }[] = [];

    async function readDirectory(dirHandle: any, path: string = '') {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          if (AUDIO_EXTENSIONS.test(entry.name)) {
            const file = await entry.getFile();
            audioFiles.push({
              file,
              relativePath: path ? `${path}/${entry.name}` : entry.name,
              folder: path || dirHandle.name || 'Device Music',
            });
          }
        } else if (entry.kind === 'directory') {
          if (!entry.name.startsWith('.')) {
            await readDirectory(entry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      }
    }

    await readDirectory(handle);
    if (audioFiles.length === 0) return [];

    const tracks: Track[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const { file, folder } = audioFiles[i];
      if (onProgress) {
        onProgress(i + 1, audioFiles.length, file.name);
      }
      const track = await processAudioFile(file, folder, i);
      tracks.push(track);
    }
    return tracks;
  } catch (err) {
    console.debug('Auto-scan directory info:', err);
    return [];
  }
}

/**
 * Modern Directory Picker to scan phone / device storage folders
 */
export async function scanPhoneMusicDirectory(
  onProgress?: ScanProgressCallback
): Promise<Track[]> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Directory access API is not supported in this browser. Please use file picker.');
  }

  try {
    // Prompt the user to select their phone's music folder (e.g. /Music, /Download)
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'phone-music-storage',
      mode: 'read',
      startIn: 'music',
    });

    // Save handle so next app launch scans automatically with 0 clicks!
    await saveDirectoryHandle(dirHandle);

    const audioFiles: { file: File; relativePath: string; folder: string }[] = [];

    // Recursive directory reader
    async function readDirectory(
      handle: any,
      path: string = ''
    ) {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          if (AUDIO_EXTENSIONS.test(entry.name)) {
            const file = await entry.getFile();
            audioFiles.push({
              file,
              relativePath: path ? `${path}/${entry.name}` : entry.name,
              folder: path || handle.name || 'Device Music',
            });
          }
        } else if (entry.kind === 'directory') {
          // Skip hidden / system folders
          if (!entry.name.startsWith('.')) {
            await readDirectory(entry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      }
    }

    await readDirectory(dirHandle);

    if (audioFiles.length === 0) {
      return [];
    }

    // Process all found audio files
    const tracks: Track[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const { file, folder } = audioFiles[i];
      if (onProgress) {
        onProgress(i + 1, audioFiles.length, file.name);
      }

      const track = await processAudioFile(file, folder, i);
      tracks.push(track);
    }

    return tracks;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User cancelled picker
      return [];
    }
    throw err;
  }
}

/**
 * Process a FileList or array of audio files selected by user
 */
export async function scanAudioFiles(
  files: FileList | File[],
  onProgress?: ScanProgressCallback
): Promise<Track[]> {
  const fileArray = Array.from(files).filter(
    (f) => f.type.startsWith('audio/') || AUDIO_EXTENSIONS.test(f.name)
  );

  const tracks: Track[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (onProgress) {
      onProgress(i + 1, fileArray.length, file.name);
    }

    // Determine folder from webkitRelativePath if present
    const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
    const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Phone Storage';

    const track = await processAudioFile(file, folderName, i);
    tracks.push(track);
  }

  return tracks;
}

/**
 * Parse metadata and store single audio file into IndexedDB
 */
async function processAudioFile(
  file: File,
  folderName: string,
  index: number
): Promise<Track> {
  const objectUrl = URL.createObjectURL(file);
  const trackId = `phone-track-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;

  // Parse ID3 metadata (Title, Artist, Album, Cover Art, Lyrics, Bitrate)
  const meta = await parseAudioMetadata(file);

  // Save blob to IndexedDB for true persistent offline access across browser sessions
  try {
    await storeAudioBlobOffline(trackId, file);
  } catch (err) {
    console.warn('Failed to store audio blob in IndexedDB:', err);
  }

  return {
    id: trackId,
    title: meta.title,
    artist: meta.artist,
    album: meta.album || folderName,
    duration: meta.duration || 180,
    url: objectUrl,
    coverArt: meta.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    folder: folderName,
    isFavorite: false,
    playCount: 0,
    dateAdded: Date.now(),
    isOffline: true,
    lyrics: meta.lyrics,
    bitrate: meta.bitrate,
    sampleRate: meta.sampleRate || '44.1 kHz',
    fileSize: meta.fileSize,
    sourceType: 'user-upload',
  };
}

/**
 * Restores playable blob URLs for user-uploaded tracks from IndexedDB
 */
export async function restoreTrackBlobUrls(tracks: Track[]): Promise<Track[]> {
  const updatedTracks: Track[] = [];

  for (const track of tracks) {
    if (track.sourceType === 'user-upload' || track.id.startsWith('phone-track-') || track.id.startsWith('upload-')) {
      try {
        const blob = await getAudioBlobOffline(track.id);
        if (blob) {
          const freshUrl = URL.createObjectURL(blob);
          updatedTracks.push({
            ...track,
            url: freshUrl,
            isOffline: true,
          });
          continue;
        }
      } catch (err) {
        console.warn('Error restoring blob for track:', track.id, err);
      }
    }
    updatedTracks.push(track);
  }

  return updatedTracks;
}
