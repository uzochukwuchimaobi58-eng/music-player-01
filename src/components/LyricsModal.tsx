import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Music,
  HardDrive,
  Edit3,
  Check,
  Search,
  Download,
  Mic2,
  MicOff,
  Radio,
  Play,
  Pause,
  Sliders,
  ScanLine,
  Subtitles,
  Tv,
  FolderOpen,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import { Track } from '../types';
import { autoScanTrackLyrics, parseLrcLyrics, saveLrcToCache, ParsedLyricLine } from '../services/lyricsScanner';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  isKaraokeMode?: boolean;
  onToggleKaraoke?: (enabled: boolean) => void;
  onUpdateLyrics?: (trackId: string, newLyrics: string) => void;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  isKaraokeMode = false,
  onToggleKaraoke,
  onUpdateLyrics,
  onSeek,
  isPlaying = false,
  onTogglePlay,
}) => {
  const [viewMode, setViewMode] = useState<'captions' | 'full'>('captions');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [isScanningMusic, setIsScanningMusic] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [lyricsSourceLabel, setLyricsSourceLabel] = useState<string>('Live Synchronized');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scan on modal open if track does not have lyrics
  useEffect(() => {
    if (isOpen && track) {
      setEditedLyrics(track.lyrics || '');
      if (!track.lyrics || track.lyrics.trim().length === 0) {
        handleAutoScan();
      }
    }
  }, [isOpen, track?.id]);

  if (!isOpen || !track) return null;

  const rawLyrics = editedLyrics || track.lyrics || '';

  // Parse lines with timestamps using the robust LRC parser
  const parsedLines: ParsedLyricLine[] = parseLrcLyrics(rawLyrics, track.duration || 180);

  // Active line index based on playback currentTime
  let currentLineIndex = -1;
  for (let i = parsedLines.length - 1; i >= 0; i--) {
    if (currentTime >= parsedLines[i].time) {
      currentLineIndex = i;
      break;
    }
  }

  const handleStartEdit = () => {
    setEditedLyrics(rawLyrics);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdateLyrics) {
      onUpdateLyrics(track.id, editedLyrics);
    }
    saveLrcToCache(track, editedLyrics);
    setIsEditing(false);
  };

  // Auto-Scan lyrics from metadata, cached files, or local files
  const handleAutoScan = async (selectedFiles?: File[]) => {
    setIsScanningMusic(true);
    setScanSuccess(null);
    setScanStep('Searching track metadata and local caption files...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setScanStep('Parsing LRC timestamps and audio cadence markers...');
      const result = await autoScanTrackLyrics(track, selectedFiles);

      if (onUpdateLyrics) {
        onUpdateLyrics(track.id, result.lyrics);
      }
      setEditedLyrics(result.lyrics);
      setLyricsSourceLabel(result.sourceLabel);
      setViewMode('captions');
      setScanSuccess(`Auto-scan complete! Synced with ${result.sourceLabel}.`);
      setTimeout(() => setScanSuccess(null), 4000);
    } catch (e) {
      console.error('Scan error', e);
      setScanSuccess('Scan failed. You can paste LRC lyrics manually.');
    } finally {
      setIsScanningMusic(false);
      setScanStep('');
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files) as File[];
      handleAutoScan(fileList);
    }
  };

  return (
    <div
      id="lyrics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverArt}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {track.title}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {track.artist} · {track.album}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* AI Karaoke Toggle */}
            {onToggleKaraoke && (
              <button
                onClick={() => onToggleKaraoke(!isKaraokeMode)}
                title="AI Karaoke (Vocal Remover)"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isKaraokeMode
                    ? 'bg-rose-500 text-white shadow-lg animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {isKaraokeMode ? <MicOff className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5 text-rose-400" />}
                <span className="hidden sm:inline">{isKaraokeMode ? 'Karaoke ON' : 'Karaoke'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Captions vs Full Text */}
        <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('captions')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === 'captions'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Live Captions</span>
            </button>

            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Lyrics</span>
            </button>
          </div>

          {/* Hidden local file picker for LRC/SRT captions */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".lrc,.srt,.txt,text/plain"
            onChange={handleLocalFileSelect}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            {/* Import Local LRC File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import local .lrc or caption file from phone"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-[11px] border border-zinc-700 transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Import LRC</span>
            </button>

            {/* Auto-Scan Music & Metadata Button */}
            <button
              id="btn-auto-scan-lyrics"
              onClick={() => handleAutoScan()}
              disabled={isScanningMusic}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-[11px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>{isScanningMusic ? 'Scanning...' : 'Auto-Scan'}</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={handleStartEdit}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="Edit Lyrics Text"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scan Status Banner */}
        {isScanningMusic && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="font-semibold">{scanStep}</span>
          </div>
        )}

        {scanSuccess && (
          <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{scanSuccess}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-[260px] flex flex-col justify-center">
          {isEditing ? (
            <textarea
              value={editedLyrics}
              onChange={(e) => setEditedLyrics(e.target.value)}
              rows={12}
              className="w-full h-full p-3.5 rounded-2xl bg-zinc-900 text-zinc-100 text-xs font-mono border border-zinc-700 focus:outline-none focus:border-amber-500 leading-relaxed"
              placeholder="Paste or write lyrics with timestamps [mm:ss.xx]..."
            />
          ) : viewMode === 'captions' ? (
            /* --- LIVE CAPTIONS / TELEPROMPTER VIEW --- */
            <div className="text-center space-y-4 my-auto">
              {parsedLines.length > 0 ? (
                <div className="space-y-3 py-3">
                  {/* Previous Line */}
                  {currentLineIndex > 0 && (
                    <p
                      onClick={() => onSeek && onSeek(parsedLines[currentLineIndex - 1].time)}
                      className="text-xs sm:text-sm text-zinc-500 font-medium line-clamp-1 transition-all cursor-pointer hover:text-zinc-300"
                    >
                      {parsedLines[currentLineIndex - 1].text}
                    </p>
                  )}

                  {/* Active Live Caption Line */}
                  <div className="py-2.5 px-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5">
                    <p className="text-lg sm:text-2xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all scale-105 duration-200">
                      {currentLineIndex >= 0 && currentLineIndex < parsedLines.length
                        ? `🎤 ${parsedLines[currentLineIndex].text}`
                        : `♪ Playing ${track.title} ♪`}
                    </p>
                    <span className="text-[10px] font-mono text-amber-400/90 mt-1 block">
                      ⚡ {lyricsSourceLabel}
                    </span>
                  </div>

                  {/* Next Line */}
                  {currentLineIndex + 1 < parsedLines.length && (
                    <p
                      onClick={() => onSeek && onSeek(parsedLines[currentLineIndex + 1].time)}
                      className="text-xs sm:text-sm text-zinc-400 font-medium line-clamp-1 transition-all cursor-pointer hover:text-zinc-200"
                    >
                      {parsedLines[currentLineIndex + 1].text}
                    </p>
                  )}

                  {/* Following Line preview */}
                  {currentLineIndex + 2 < parsedLines.length && (
                    <p className="text-[11px] text-zinc-600 line-clamp-1">
                      {parsedLines[currentLineIndex + 2].text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <ScanLine className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-white">Auto-Scan Track Captions</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Automatically scan embedded ID3 tags, local LRC files, or cadence markers to sync lyrics with playback.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => handleAutoScan()}
                      disabled={isScanningMusic}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Scan Now</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-400" />
                      <span>Choose .LRC File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- FULL LYRICS SCROLL VIEW --- */
            <div className="space-y-2 text-center py-2">
              {parsedLines.length > 0 ? (
                parsedLines.map((line, idx) => (
                  <p
                    key={idx}
                    onClick={() => onSeek && line.time > 0 && onSeek(line.time)}
                    className={`text-sm sm:text-base py-1 px-2 rounded-xl transition-all cursor-pointer ${
                      idx === currentLineIndex
                        ? 'text-amber-300 font-black bg-amber-500/15 border border-amber-500/30 scale-102 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    {line.text}
                  </p>
                ))
              ) : (
                <p className="text-xs text-zinc-400">No lyrics text found. Tap "Scan Music" above.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-zinc-800 bg-black/80 flex items-center justify-between gap-3 text-xs">
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Song'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono ml-auto">
            <span>Caption Format: LRC Synced</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
