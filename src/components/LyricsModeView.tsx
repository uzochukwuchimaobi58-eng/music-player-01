import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Type,
  WifiOff,
  RotateCcw,
  Sparkles,
  Subtitles,
  FolderOpen,
  ScanLine
} from 'lucide-react';
import { Track } from '../types';
import { VisualizerCanvas } from './VisualizerCanvas';
import { parseLrcLyrics, autoScanTrackLyrics, ParsedLyricLine, saveLrcToCache } from '../services/lyricsScanner';

interface LyricsModeViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onToggleFavorite: (trackId: string) => void;
  onExitLyricsMode: () => void;
  onUpdateLyrics?: (trackId: string, newLyrics: string) => void;
  accentColorHex?: string;
}

export const LyricsModeView: React.FC<LyricsModeViewProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onToggleFavorite,
  onExitLyricsMode,
  onUpdateLyrics,
  accentColorHex = '#f59e0b',
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isScanning, setIsScanning] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [scannedLyrics, setScannedLyrics] = useState<string>('');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync lyrics from currentTrack
  useEffect(() => {
    if (currentTrack) {
      const existing = currentTrack.lyrics || '';
      setScannedLyrics(existing);

      // If no lyrics, auto scan immediately
      if (!existing || existing.trim().length === 0) {
        handleAutoScan(false);
      } else {
        setShowOfflineNotice(false);
      }
    }
  }, [currentTrack?.id]);

  const rawLyrics = scannedLyrics || currentTrack?.lyrics || '';
  const parsedLines: ParsedLyricLine[] = parseLrcLyrics(rawLyrics, duration || currentTrack?.duration || 180);

  // Determine active line index
  let activeIndex = 0;
  if (parsedLines.length > 0) {
    if (currentTime < parsedLines[0].time) {
      activeIndex = 0;
    } else {
      for (let i = parsedLines.length - 1; i >= 0; i--) {
        if (currentTime >= parsedLines[i].time) {
          activeIndex = i;
          break;
        }
      }
    }
  }

  // Smoothly center active lyric line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  // Handle auto-scanning
  const handleAutoScan = async (isManualRetry: boolean = false) => {
    if (!currentTrack) return;
    setIsScanning(true);

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);

    try {
      const res = await autoScanTrackLyrics(currentTrack);
      if (res.isOfflineNoData) {
        setShowOfflineNotice(true);
      } else if (res.lyrics && res.lyrics.trim().length > 0) {
        setScannedLyrics(res.lyrics);
        setShowOfflineNotice(false);
        if (onUpdateLyrics) {
          onUpdateLyrics(currentTrack.id, res.lyrics);
        }
      } else {
        if (!online) {
          setShowOfflineNotice(true);
        }
      }
    } catch (err) {
      console.warn('Lyrics auto-scan error:', err);
      if (!online) {
        setShowOfflineNotice(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportLocalLrc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentTrack) {
      try {
        const text = await file.text();
        if (text.trim().length > 0) {
          setScannedLyrics(text);
          setShowOfflineNotice(false);
          if (onUpdateLyrics) {
            onUpdateLyrics(currentTrack.id, text);
          }
          await saveLrcToCache(currentTrack, text);
        }
      } catch (err) {
        console.error('Error importing LRC file:', err);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cycleFontSize = () => {
    setFontSizeLevel((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'));
  };

  if (!currentTrack) return null;

  return (
    <div
      id="lyrics-mode-view"
      className="fixed inset-0 z-50 bg-[#06080d] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Dynamic atmospheric blurred background from album art */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 filter blur-3xl scale-125 transition-all duration-700 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, ${accentColorHex}40 0%, transparent 60%), url(${currentTrack.coverArt})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#07090e]/90 to-[#040508] pointer-events-none -z-10" />

      {/* Hidden local file picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".lrc,.srt,.txt,text/plain"
        onChange={handleImportLocalLrc}
        className="hidden"
      />

      {/* Top Header Bar: Exit Chevron & Actions */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10 shrink-0">
        <button
          id="btn-exit-lyrics-mode"
          onClick={onExitLyricsMode}
          className="p-2.5 rounded-full bg-black/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg"
          title="Back to Music Player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-bold text-zinc-200 tracking-wider flex items-center gap-1.5 shadow-sm">
            <Subtitles className="w-3.5 h-3.5 text-amber-400" />
            <span>LYRICS MODE</span>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full bg-black/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg"
          title="Import Local .LRC File"
        >
          <FolderOpen className="w-4 h-4 text-zinc-300" />
        </button>
      </div>

      {/* Top Album Artwork Card (Exact reproduction of screenshot) */}
      <div className="flex flex-col items-center justify-center px-6 pt-1 pb-3 shrink-0 z-10">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-950/80 flex flex-col justify-between p-3.5 backdrop-blur-md group">
          {/* Subtle background album image behind card */}
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover -z-10 brightness-90 group-hover:scale-105 transition-transform duration-500"
          />
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 -z-10" />

          {/* Top Artist Name (e.g. AURORA BLOOM) */}
          <div className="text-center pt-1">
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] text-zinc-100 uppercase drop-shadow-md truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Bottom Subtitle (e.g. Echoes of the Night) */}
          <div className="text-center pb-1">
            <p className="text-[11px] sm:text-xs font-semibold text-zinc-300 drop-shadow-md truncate">
              {currentTrack.album || currentTrack.title}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live Synchronized Lyrics Flow (Exact reproduction of screenshot) */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center justify-center text-center space-y-4 no-scrollbar z-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Offline Warning Notice if no lyrics and no internet */}
        {showOfflineNotice && (!parsedLines || parsedLines.length === 0) ? (
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-amber-500/40 text-center max-w-xs mx-auto shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <WifiOff className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-black text-white mb-1 tracking-tight">You're offline for lyrics</h4>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed font-medium">
              Please turn on your mobile data or network so the app can automatically scan and display lyrics for this song.
            </p>
            <button
              onClick={() => handleAutoScan(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-105 text-black font-extrabold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Turned On Data? Tap to Retry</span>
            </button>
          </div>
        ) : isScanning ? (
          /* Live Scanning Indicator */
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ScanLine className="w-5 h-5 animate-spin" />
            </div>
            <p className="text-sm font-bold text-amber-300">Scanning music & matching synchronized lyrics...</p>
            <p className="text-xs text-zinc-400 font-medium">{currentTrack.title} · {currentTrack.artist}</p>
          </div>
        ) : parsedLines.length > 0 ? (
          /* Synchronized Lyrics Stack matching screenshot */
          parsedLines.map((line, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);

            // Opacity & scaling based on distance to active line
            const opacityClass = isActive
              ? 'opacity-100'
              : distance === 1
              ? 'opacity-65'
              : distance === 2
              ? 'opacity-40'
              : 'opacity-20';

            return (
              <div
                key={`${index}-${line.time}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`w-full max-w-lg cursor-pointer transition-all duration-300 ${opacityClass} ${
                  isActive ? 'py-2 scale-[1.03]' : 'py-1 scale-100 hover:opacity-80'
                }`}
              >
                <p
                  className={`leading-relaxed tracking-tight ${
                    isActive
                      ? fontSizeLevel === 'normal'
                        ? 'text-lg sm:text-xl font-black text-amber-300 drop-shadow-[0_2px_14px_rgba(245,158,11,0.5)]'
                        : fontSizeLevel === 'large'
                        ? 'text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_18px_rgba(245,158,11,0.55)]'
                        : 'text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_2px_22px_rgba(245,158,11,0.6)]'
                      : fontSizeLevel === 'normal'
                      ? 'text-sm sm:text-base font-semibold text-zinc-400'
                      : fontSizeLevel === 'large'
                      ? 'text-base sm:text-lg font-semibold text-zinc-400'
                      : 'text-lg sm:text-xl font-semibold text-zinc-400'
                  }`}
                >
                  {line.text}
                </p>
              </div>
            );
          })
        ) : (
          /* No Lyrics Fallback */
          <div className="py-10 text-center max-w-xs space-y-3">
            <p className="text-sm font-semibold text-zinc-300">
              No synchronized lyrics found yet for this song.
            </p>
            <button
              onClick={() => handleAutoScan(true)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs border border-zinc-700 transition-all cursor-pointer shadow"
            >
              Scan Again Online
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Visualizer + Progress Scrubber + Controls to change music (Exact match to screenshot) */}
      <div className="px-6 pb-6 pt-1 flex flex-col gap-3 shrink-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Luminous Sound Wave Visualizer above progress line */}
        <div className="w-full max-w-md mx-auto h-7 sm:h-8 flex items-center justify-center opacity-90 px-2">
          <VisualizerCanvas
            isPlaying={isPlaying}
            type="wave"
            color="#ffffff"
            barCount={36}
          />
        </div>

        {/* Timeline Scrubber */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-1.5">
          <input
            id="lyrics-timeline-slider"
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />

          {/* Formatted time display: 0:45 / 5:55 */}
          <div className="flex justify-center text-xs font-mono font-semibold text-zinc-400">
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Music changing controls row ("with a place to change music will be display down") */}
        <div className="w-full max-w-md mx-auto flex items-center justify-center gap-6 mt-1">
          {/* Previous Track */}
          <button
            id="btn-lyrics-prev"
            onClick={onPrevTrack}
            className="p-3 rounded-full text-zinc-300 hover:text-white active:scale-90 transition-all cursor-pointer hover:bg-white/5"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Play / Pause Button */}
          <button
            id="btn-lyrics-play-pause"
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            id="btn-lyrics-next"
            onClick={onNextTrack}
            className="p-3 rounded-full text-zinc-300 hover:text-white active:scale-90 transition-all cursor-pointer hover:bg-white/5"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* Bottom Actions Row: Heart and Aa Font size */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-6 pt-1">
          {/* Favorite Heart */}
          <button
            id="btn-lyrics-favorite"
            onClick={() => onToggleFavorite(currentTrack.id)}
            className="p-2 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer active:scale-90 flex items-center gap-1.5"
            title="Favorite"
          >
            <Heart
              className={`w-5 h-5 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Aa Font Size Switcher */}
          <button
            id="btn-lyrics-font-size"
            onClick={cycleFontSize}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-90 flex items-center justify-center font-bold text-sm"
            title={`Font Size: ${fontSizeLevel.toUpperCase()} (Tap to change)`}
          >
            <span className="font-serif tracking-tighter text-base">Aa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
