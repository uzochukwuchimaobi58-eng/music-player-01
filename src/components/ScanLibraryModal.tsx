import React, { useState, useRef } from 'react';
import {
  X,
  FolderSync,
  UploadCloud,
  HardDriveDownload,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  FolderUp,
  Music,
  Loader2,
  Sparkles,
  ShieldAlert,
  Clock,
  Disc3
} from 'lucide-react';
import { Track, Song } from '../types';
import { MusicLibrary } from '../plugins/MusicLibrary';
import {
  scanPhoneMusicDirectory,
  scanAudioFiles,
  isFileSystemAccessSupported,
} from '../services/deviceScanner';

interface ScanLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTracks: (newTracks: Track[]) => void;
  existingTracks: Track[];
  onMakeAllOffline: () => Promise<void>;
  isCachingAll: boolean;
}

export const ScanLibraryModal: React.FC<ScanLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddTracks,
  existingTracks,
  onMakeAllOffline,
  isCachingAll,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [noMusicFound, setNoMusicFound] = useState<boolean>(false);
  const [discoveredSongs, setDiscoveredSongs] = useState<Song[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Primary Native MediaStore MusicLibrary.scan() Scanner
  const handleNativeScanMusic = async () => {
    setIsProcessing(true);
    setStatusMessage('Scanning phone for music files...');
    setPermissionError(null);
    setNoMusicFound(false);
    setCurrentProgress(null);

    try {
      // 1. Call native Capacitor plugin MusicLibrary.scanSongs()
      const result = await MusicLibrary.scanSongs();

      if (result && result.songs && result.songs.length > 0) {
        setDiscoveredSongs(result.songs);
        setNoMusicFound(false);

        // Convert Native Song[] to Track[] for library state
        const convertedTracks: Track[] = result.songs.map((s, idx) => ({
          id: `native-${s.id || idx}-${Date.now()}`,
          title: s.title,
          artist: s.artist,
          album: s.album,
          duration: Math.max(1, Math.round((s.duration || 0) / 1000)),
          url: s.uri,
          coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
          folder: s.album || 'Phone Music',
          isFavorite: false,
          playCount: 0,
          dateAdded: Date.now(),
          isOffline: true,
          sourceType: 'user-upload',
        }));

        const uniqueNewTracks = convertedTracks.filter(
          (nt) => !existingTracks.some((et) => et.title === nt.title && et.artist === nt.artist)
        );

        onAddTracks(uniqueNewTracks.length > 0 ? uniqueNewTracks : convertedTracks);
        setStatusMessage(`Successfully discovered ${result.songs.length} songs from device storage!`);
      } else {
        // Fallback check for web/desktop environment if native plugin returned 0 songs
        if (isFileSystemAccessSupported()) {
          try {
            const webTracks = await scanPhoneMusicDirectory((cur, tot, fn) => {
              setCurrentProgress({ current: cur, total: tot, fileName: fn });
            });
            if (webTracks.length > 0) {
              const uniqueNew = webTracks.filter(
                (nt) => !existingTracks.some((et) => et.title === nt.title && et.artist === nt.artist)
              );
              onAddTracks(uniqueNew.length > 0 ? uniqueNew : webTracks);
              setDiscoveredSongs(
                webTracks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  artist: t.artist,
                  album: t.album,
                  duration: t.duration * 1000,
                  uri: t.url,
                  albumId: '0',
                }))
              );
              setStatusMessage(`Scanned ${webTracks.length} tracks from phone storage!`);
              return;
            }
          } catch (dirErr: any) {
            if (dirErr?.name === 'AbortError') {
              setIsProcessing(false);
              return;
            }
          }
        }

        setDiscoveredSongs([]);
        setNoMusicFound(true);
        setStatusMessage('');
      }
    } catch (err: any) {
      console.warn('Native scan error:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.toLowerCase().includes('permission') ||
        err?.code === 'PERMISSION_DENIED' ||
        errMsg.toLowerCase().includes('denied')
      ) {
        setPermissionError(
          'Music access permission is required to scan local songs on your device. Please grant permission in Settings.'
        );
      } else {
        setPermissionError(`Scan error: ${errMsg || 'Could not access device media'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`Reading ${files.length} audio tracks...`);
    setPermissionError(null);
    setNoMusicFound(false);
    setCurrentProgress(null);

    try {
      const tracks = await scanAudioFiles(files, (current, total, fileName) => {
        setCurrentProgress({ current, total, fileName });
      });

      if (tracks.length > 0) {
        const uniqueNewTracks = tracks.filter(
          (nt) => !existingTracks.some((et) => et.title === nt.title && et.artist === nt.artist)
        );

        onAddTracks(uniqueNewTracks.length > 0 ? uniqueNewTracks : tracks);
        setDiscoveredSongs(
          tracks.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.duration * 1000,
            uri: t.url,
            albumId: '0',
          }))
        );
        setStatusMessage(`Imported ${tracks.length} tracks to your music library!`);
      } else {
        setNoMusicFound(true);
      }
    } catch (err) {
      console.error('File scan error:', err);
      setStatusMessage('Error scanning files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      id="scan-library-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Scan Local Music</h3>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                Android MediaStore Native Scanner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Prominent "Scan Music" Trigger Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Device Storage Scanner</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                MediaStore API
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Scans your device’s local storage to automatically index and load all music tracks (MP3, WAV, FLAC, M4A, AAC) sorted alphabetically.
            </p>

            <button
              id="btn-scan-music-primary"
              onClick={handleNativeScanMusic}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Phone Music...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 text-black" />
                  <span>Scan Music</span>
                </>
              )}
            </button>
          </div>

          {/* Permission Denied Error State */}
          {permissionError && (
            <div
              id="permission-error-card"
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-200">Permission Required</p>
                <p className="text-[11px] text-red-300/90 leading-relaxed">{permissionError}</p>
              </div>
            </div>
          )}

          {/* No Music Found State */}
          {noMusicFound && !isProcessing && (
            <div
              id="no-music-found-card"
              className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1.5 animate-in fade-in"
            >
              <Disc3 className="w-6 h-6 text-zinc-500 mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">No music found on this device.</p>
              <p className="text-[11px] text-zinc-500">
                Make sure you have audio files stored in your Music or Downloads folder.
              </p>
            </div>
          )}

          {/* Loading Indicator with progress */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-indigo-500/30 text-xs space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reading MediaStore Audio Records...</span>
              </div>
              {currentProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px] text-zinc-400">
                    <span>File {currentProgress.current} / {currentProgress.total}</span>
                    <span>{Math.round((currentProgress.current / currentProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && !permissionError && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Discovered Songs Display List */}
          {discoveredSongs.length > 0 && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                  Discovered Songs ({discoveredSongs.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Sorted A-Z</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-900 border border-zinc-800 rounded-xl bg-zinc-900/60 p-2">
                {discoveredSongs.map((song, idx) => (
                  <div key={song.id || idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1 px-1.5 hover:bg-zinc-800/60 rounded">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                        <Music className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100 truncate text-xs">{song.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{song.artist} • {song.album}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag and Drop / Manual Folder Alternative */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-900/30 hover:bg-zinc-900/60 group"
          >
            <UploadCloud className="w-5 h-5 text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-zinc-300">Or Select Files Manually</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Click or drag audio files here</p>
          </div>

          {/* Hidden inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.opus,.wma"
            className="hidden"
          />

          <input
            type="file"
            ref={folderInputRef}
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            className="hidden"
          />

          {/* Additional Utility Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-scan-folder-input"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FolderUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Select Folder</span>
            </button>

            <button
              id="btn-cache-demo-tracks"
              onClick={onMakeAllOffline}
              disabled={isCachingAll || isProcessing}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isCachingAll ? 'Caching...' : 'Cache Demo Audio'}</span>
            </button>
          </div>

          {/* Library Summary */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Library Songs: <b className="text-white font-mono">{existingTracks.length}</b></span>
            <span>Offline Ready: <b className="text-emerald-400 font-mono">{existingTracks.filter((t) => t.isOffline).length}</b></span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-black/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow transition-all cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
