import React, { useState } from 'react';
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
  Crown
} from 'lucide-react';
import { Track, RepeatMode } from '../types';
import { TrendingAudioEffect } from '../services/audioEngine';
import { VisualizerCanvas } from './VisualizerCanvas';

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

  if (!isOpen || !currentTrack) return null;

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
      className="fixed inset-0 z-50 flex flex-col bg-[#050505] text-zinc-100 select-none overflow-y-auto animate-in slide-in-from-bottom-5 duration-300 font-sans"
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

      <div className="relative z-10 flex flex-col min-h-full max-w-lg mx-auto w-full p-4 sm:p-6 justify-between">
        {/* Top App Bar */}
        <div className="flex items-center justify-between">
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
            {/* Pro Badge / Upgrade trigger */}
            <button
              onClick={onOpenProModal}
              title="Upgrade to Pro"
              className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                isProUser
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md active:scale-95'
              }`}
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>{isProUser ? 'PRO' : 'GO PRO'}</span>
            </button>

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
          </div>
        </div>

        {/* Center Artwork & Visualizer */}
        <div className="my-auto py-3 flex flex-col items-center">
          {/* Vinyl Disc Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-1 flex items-center justify-center">
            {/* Ambient visualizer ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                isPlaying ? 'scale-105 opacity-40 shadow-[0_0_60px_rgba(255,255,255,0.15)]' : 'opacity-10'
              }`}
            />

            {/* Vinyl Record */}
            <div
              className={`relative w-full h-full rounded-full p-2.5 bg-zinc-950 border-4 border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center ${
                isPlaying ? 'animate-[spin_16s_linear_infinite]' : ''
              }`}
            >
              {/* Vinyl Groove Rings */}
              <div className="absolute inset-4 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-zinc-800/60 pointer-events-none" />
              <div className="absolute inset-12 rounded-full border border-zinc-800/40 pointer-events-none" />

              {/* Album Art Centerpiece */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-zinc-700 shadow-inner">
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Center spindle hole */}
                <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-black border-2 border-zinc-500 shadow-md" />
              </div>
            </div>
          </div>

          {/* Audio Visualizer Canvas */}
          <div className="w-full max-w-xs h-10 mt-3 px-2">
            <VisualizerCanvas
              isPlaying={isPlaying}
              type={visualizerMode}
              color="#ffffff"
              barCount={28}
            />
          </div>

          {/* Viral FX & Tools Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            {/* Trending Audio Mode Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFXMenu(!showFXMenu)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 hover:text-white transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="capitalize">{activeTrendingEffect.replace('_', ' ')}</span>
              </button>

              {showFXMenu && (
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 w-60 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-bold text-zinc-500 px-2 py-1 uppercase tracking-widest">
                    Trending Audio Filters
                  </p>
                  {trendingEffectsList.map((fx) => (
                    <button
                      key={fx.id}
                      onClick={() => {
                        onSetTrendingEffect(fx.id);
                        setShowFXMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                        activeTrendingEffect === fx.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{fx.icon}</span>
                        <div>
                          <p className="text-xs">{fx.label}</p>
                          <p className="text-[9px] opacity-75">{fx.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Karaoke Mode Toggle */}
            <button
              onClick={onToggleKaraoke}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                isKaraokeMode
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isKaraokeMode ? <MicOff className="w-3 h-3 text-rose-400" /> : <Mic2 className="w-3 h-3 text-rose-400" />}
              <span>{isKaraokeMode ? 'Karaoke ON' : 'Karaoke'}</span>
            </button>

            {/* Ringtone Cutter Shortcut */}
            <button
              onClick={onOpenRingtoneTrimmer}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Scissors className="w-3 h-3 text-emerald-400" />
              <span>Trim Ringtone</span>
            </button>

            {/* Visualizer Mode Switcher */}
            <button
              onClick={() => {
                setVisualizerMode((prev) =>
                  prev === 'bars' ? 'wave' : prev === 'wave' ? 'circle' : 'bars'
                );
              }}
              className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors uppercase"
            >
              FX: {visualizerMode}
            </button>
          </div>
        </div>

        {/* Track Title, Artist, and Favorite Heart */}
        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-medium text-zinc-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <button
            id="btn-full-favorite"
            onClick={() => onToggleFavorite(currentTrack.id)}
            className="p-2.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
          >
            <Heart
              className={`w-6 h-6 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Seek Bar / Slider */}
        <div className="mt-3">
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

          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls: Shuffle, Prev, Rewind 10, Play/Pause, Forward 10, Next, Repeat */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* Shuffle Toggle */}
          <button
            id="btn-full-shuffle"
            onClick={onToggleShuffle}
            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isShuffle ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            title="Rewind 10s"
            className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            id="btn-full-prev"
            onClick={onPrevTrack}
            className="p-2 rounded-lg text-white hover:text-zinc-300 active:scale-90 transition-all cursor-pointer"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Center Big Play / Pause Button */}
          <button
            id="btn-full-play-pause"
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-black" />
            ) : (
              <Play className="w-8 h-8 fill-black ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            id="btn-full-next"
            onClick={onNextTrack}
            className="p-2 rounded-lg text-white hover:text-zinc-300 active:scale-90 transition-all cursor-pointer"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            title="Forward 10s"
            className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Repeat Mode */}
          <button
            id="btn-full-repeat"
            onClick={onToggleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Bottom Utility Bar: Volume, Speed, Sleep, Lyrics */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-zinc-800/80">
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-[150px]">
            <button
              onClick={onToggleMute}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
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
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Timer className="w-4 h-4" />
            </button>

            {/* Lyrics viewer */}
            <button
              onClick={onOpenLyrics}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lyrics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
