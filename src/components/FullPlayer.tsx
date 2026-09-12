import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Sliders,
  Timer,
  FileText,
  RotateCcw,
  RotateCw,
  Sparkles,
  Share2,
  ListMusic,
  Gauge,
  Scissors,
  Zap,
  Mic2,
  MicOff,
  Camera,
  MoreVertical,
  Image as ImageIcon,
  Subtitles,
  X,
  Check,
} from 'lucide-react';
import { Track, RepeatMode } from '../types';
import { TrendingAudioEffect } from '../services/audioEngine';
import { VisualizerCanvas } from './VisualizerCanvas';
import { parseLrcLyrics } from '../services/lyricsScanner';

interface FullPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  activeTrendingEffect: TrendingAudioEffect;
  isKaraokeMode: boolean;
  isProUser: boolean;
  forwardAndBackward?: boolean;
  swipeToChangeSongs?: boolean;
  accentColorHex?: string;
  onOpenArtwork?: (track: Track) => void;
  onOpenTrackActions?: (track: Track) => void;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetTrendingEffect: (effect: TrendingAudioEffect) => void;
  onToggleKaraoke: () => void;
  onOpenRingtoneTrimmer: () => void;
  onOpenProModal: () => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  playbackRate,
  activeTrendingEffect,
  isKaraokeMode,
  isProUser,
  forwardAndBackward = false,
  swipeToChangeSongs = true,
  accentColorHex = '#f5b731',
  onOpenArtwork,
  onOpenTrackActions,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onSetPlaybackRate,
  onSetTrendingEffect,
  onToggleKaraoke,
  onOpenRingtoneTrimmer,
  onOpenProModal,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenLyrics,
  onOpenQueue,
}) => {
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'circle'>('bars');
  const [showFXMenu, setShowFXMenu] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Dynamic Synchronized Captions based on currentTime using unified parseLrcLyrics
  const parsedLyrics = useMemo(() => {
    if (!isOpen || !currentTrack?.lyrics) return [];
    return parseLrcLyrics(currentTrack.lyrics, duration || 180);
  }, [isOpen, currentTrack?.lyrics, duration]);

  const currentCaptionText = useMemo(() => {
    if (!isOpen || parsedLyrics.length === 0) return null;
    let foundText: string | null = null;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLyrics[i].time) {
        foundText = parsedLyrics[i].text;
        break;
      }
    }
    return foundText || parsedLyrics[0]?.text || null;
  }, [isOpen, parsedLyrics, currentTime]);

  if (!isOpen || !currentTrack) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeToChangeSongs) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeToChangeSongs || touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > 50) {
      // Swiped right -> previous track
      onPrevTrack();
    } else if (diff < -50) {
      // Swiped left -> next track
      onNextTrack();
    }
    setTouchStartX(null);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const trendingEffectsList: { id: TrendingAudioEffect; label: string; desc: string; icon: string }[] = [
    { id: 'normal', label: 'Original', desc: '1.0x studio mix', icon: '🎵' },
    { id: 'sped_up', label: 'Sped Up', desc: '1.25x TikTok vibe', icon: '⚡' },
    { id: 'slowed_reverb', label: 'Slowed + Reverb', desc: '0.85x deep spatial echo', icon: '🌌' },
    { id: 'nightcore', label: 'Nightcore', desc: '1.35x pitch shifted', icon: '✨' },
    { id: 'bass_drop', label: 'Mega Bass Drop', desc: '+12dB sub-frequencies', icon: '🔊' },
    { id: 'lofi_tape', label: 'Lo-Fi Tape', desc: 'Vintage warm roll-off', icon: '📻' },
  ];

  return (
    <div
      id="full-player-modal"
      className="fixed inset-0 z-50 flex flex-col bg-[#050505] text-zinc-100 select-none overflow-hidden animate-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-125"
        style={{
          backgroundImage: `url(${currentTrack.coverArt})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 flex flex-col h-full max-h-[100dvh] max-w-lg mx-auto w-full px-4 py-2 sm:px-6 sm:py-4 justify-between overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between shrink-0">
          <button
            id="btn-close-full-player"
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              PLAYING FROM {currentTrack.folder.toUpperCase()}
            </span>
            <p className="text-xs text-zinc-400 truncate max-w-[200px]">
              {currentTrack.album}
            </p>
          </div>

          <div className="flex items-center gap-1 -mr-2">
            <button
              onClick={onOpenEqualizer}
              title="Equalizer"
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer"
            >
              <Sliders className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenQueue}
              title="Playback Queue"
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {onOpenTrackActions && (
              <button
                id="btn-full-track-actions"
                onClick={() => onOpenTrackActions(currentTrack)}
                title="Track options"
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Artwork & Visualizer */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 min-h-0 py-1 flex flex-col items-center justify-center my-auto cursor-grab active:cursor-grabbing overflow-hidden"
        >
          {/* Vinyl Disc Container - responsive height that scales down on compact screens */}
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 max-h-[18vh] sm:max-h-[24vh] aspect-square my-auto flex items-center justify-center shrink-0">
            {/* Ambient visualizer ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                isPlaying ? 'scale-105 opacity-40 shadow-[0_0_60px_rgba(255,255,255,0.15)]' : 'opacity-10'
              }`}
            />

            {/* Vinyl Record */}
            <div
              className={`relative w-full h-full rounded-full p-2 bg-zinc-950 border-4 border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center ${
                isPlaying ? 'animate-[spin_16s_linear_infinite]' : ''
              }`}
            >
              {/* Vinyl Groove Rings */}
              <div className="absolute inset-3 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-zinc-800/60 pointer-events-none" />
              <div className="absolute inset-9 rounded-full border border-zinc-800/40 pointer-events-none" />

              {/* Album Art Centerpiece */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenArtwork) onOpenArtwork(currentTrack);
                }}
                className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-zinc-700 shadow-inner group cursor-pointer"
                title="Change Cover Artwork (Camera / Gallery)"
              >
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">Edit Artwork</span>
                </div>

                {/* Center spindle hole */}
                <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-black border-2 border-zinc-500 shadow-md pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Audio Visualizer Canvas - Made bigger and taller as requested */}
          <div className="w-full max-w-sm sm:max-w-md h-12 sm:h-14 my-1 px-2 shrink-0">
            <VisualizerCanvas
              isPlaying={isPlaying}
              type={visualizerMode}
              color={accentColorHex || '#f59e0b'}
              barCount={30}
              className="w-full h-full"
            />
          </div>

          {/* Live Captions / Subtitle Bar - Made bigger and clearer as requested */}
          <div
            id="full-player-lyrics-caption-bar"
            onClick={onOpenLyrics}
            className="w-full max-w-sm sm:max-w-md my-1 px-4 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-500/60 text-center cursor-pointer transition-all shadow-lg group backdrop-blur-md shrink-0 active:scale-[0.98]"
            title="Tap to scan music or view live captions"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Subtitles className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Lyrics Captions</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1 mt-0.5 leading-snug">
              {currentCaptionText || 'Tap to Scan Music & Show Live Captions'}
            </p>
          </div>

          {/* Viral FX & Tools Chips - Made bigger and easier to tap as requested */}
          <div className="flex flex-wrap items-center justify-center gap-2 my-1 shrink-0">
            {/* Trending Audio Mode Selector Button */}
            <button
              id="btn-open-audio-fx-menu"
              onClick={() => setShowFXMenu(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/25 to-purple-500/25 border border-indigo-500/50 text-xs sm:text-sm font-bold text-indigo-200 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/20 active:scale-95"
              title="Change Audio Filter Effect"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="capitalize">{activeTrendingEffect === 'normal' ? 'Normal' : activeTrendingEffect.replace('_', ' ')}</span>
            </button>

            {/* Karaoke Mode Toggle */}
            <button
              id="btn-toggle-karaoke"
              onClick={onToggleKaraoke}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 ${
                isKaraokeMode
                  ? 'bg-rose-500/25 border-rose-500 text-rose-300 shadow-md shadow-rose-500/25 animate-pulse'
                  : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300 hover:text-white'
              }`}
            >
              {isKaraokeMode ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic2 className="w-4 h-4 text-rose-400" />}
              <span>{isKaraokeMode ? 'Karaoke ON' : 'Karaoke'}</span>
            </button>

            {/* Ringtone Cutter Shortcut */}
            <button
              id="btn-trim-ringtone"
              onClick={onOpenRingtoneTrimmer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <Scissors className="w-4 h-4 text-emerald-400" />
              <span>Trim Ringtone</span>
            </button>

            {/* Visualizer Mode Switcher */}
            <button
              id="btn-toggle-visualizer-fx"
              onClick={() => {
                setVisualizerMode((prev) =>
                  prev === 'bars' ? 'wave' : prev === 'wave' ? 'circle' : 'bars'
                );
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white border border-zinc-700/80 transition-all uppercase active:scale-95"
            >
              <span>FX: {visualizerMode}</span>
            </button>
          </div>
        </div>

        {/* Lower Controls Section: Fixed at bottom, never cut off */}
        <div className="shrink-0 flex flex-col">
          {/* Track Title, Artist, and Favorite Heart */}
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-white truncate tracking-tight">
                {currentTrack.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-zinc-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            <button
              id="btn-full-favorite"
              onClick={() => onToggleFavorite(currentTrack.id)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Seek Bar / Slider */}
          <div className="mt-1.5 sm:mt-2.5">
            <div className="relative group flex items-center">
              <input
                id="full-player-seek-slider"
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSliderSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
          <div className="flex items-center justify-between gap-2 mt-1 sm:mt-2">
            {/* Shuffle Toggle - Made bigger and clearer as requested */}
            <button
              id="btn-full-shuffle"
              onClick={onToggleShuffle}
              title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                isShuffle
                  ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/80 border-zinc-800/90 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Shuffle className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {/* Skip Back 10s (controlled by forwardAndBackward setting) */}
            {forwardAndBackward && (
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                title="Rewind 10s"
                className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Previous Track */}
            <button
              id="btn-full-prev"
              onClick={onPrevTrack}
              className="p-2.5 sm:p-3 rounded-2xl text-white hover:text-zinc-300 active:scale-90 transition-all cursor-pointer"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            {/* Center Big Play / Pause Button */}
            <button
              id="btn-full-play-pause"
              onClick={onTogglePlay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
              style={{
                boxShadow: `0 0 25px ${accentColorHex}50`
              }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              id="btn-full-next"
              onClick={onNextTrack}
              className="p-2.5 sm:p-3 rounded-2xl text-white hover:text-zinc-300 active:scale-90 transition-all cursor-pointer"
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>

            {/* Forward 10s (controlled by forwardAndBackward setting) */}
            {forwardAndBackward && (
              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                title="Forward 10s"
                className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Repeat Mode - Made bigger and clearer as requested */}
            <button
              id="btn-full-repeat"
              onClick={onToggleRepeat}
              title={`Repeat: ${repeatMode}`}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                repeatMode !== 'off'
                  ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/80 border-zinc-800/90 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-6 h-6 sm:w-7 sm:h-7" /> : <Repeat className="w-6 h-6 sm:w-7 sm:h-7" />}
            </button>
          </div>

          {/* Bottom Utility Bar: Volume, Speed, Sleep, Lyrics */}
          <div className="flex items-center justify-between gap-3 pt-1.5 mt-1 border-t border-zinc-800/80">
            {/* Volume Control */}
            <div className="flex items-center gap-2 flex-1 max-w-[140px]">
              <button
                onClick={onToggleMute}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Sleep & Lyrics Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Sleep Timer Shortcut */}
              <button
                onClick={onOpenSleepTimer}
                title="Sleep Timer"
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Timer className="w-3.5 h-3.5" />
              </button>

              {/* Lyrics viewer */}
              <button
                onClick={onOpenLyrics}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Lyrics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Modal: Trending Audio Filters Overlay on User Screen */}
      {showFXMenu && (
        <div
          id="trending-fx-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowFXMenu(false)}
        >
          <div
            id="trending-fx-modal-card"
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Audio FX & Filters</h3>
                  <p className="text-[11px] text-zinc-400">Live filters for playing music</p>
                </div>
              </div>
              <button
                id="btn-close-fx-menu"
                onClick={() => setShowFXMenu(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {trendingEffectsList.map((fx) => {
                const isSelected = activeTrendingEffect === fx.id;
                return (
                  <button
                    key={fx.id}
                    id={`btn-fx-${fx.id}`}
                    onClick={() => {
                      onSetTrendingEffect(fx.id);
                      setShowFXMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                        : 'text-zinc-200 hover:bg-zinc-900 border border-zinc-800/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/5">{fx.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{fx.label}</p>
                        <p className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>{fx.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mr-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
