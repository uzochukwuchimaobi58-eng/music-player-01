import React from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Car,
  Volume2,
  Sparkles,
  Shuffle
} from 'lucide-react';
import { Track } from '../types';
import { VisualizerCanvas } from './VisualizerCanvas';

interface DriveModeViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onToggleFavorite: (trackId: string) => void;
  onExitDriveMode: () => void;
}

export const DriveModeView: React.FC<DriveModeViewProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onToggleFavorite,
  onExitDriveMode,
}) => {
  if (!currentTrack) return null;

  return (
    <div
      id="drive-mode-view"
      className="fixed inset-0 z-50 bg-[#050505] text-zinc-100 flex flex-col justify-between p-6 select-none animate-in zoom-in-95 duration-200 font-sans"
    >
      {/* Top Bar: Exit button & Drive Mode indicator & Safety reminder */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider">
            <Car className="w-4 h-4 text-amber-400" />
            <span>Drive Mode</span>
          </div>

          <button
            onClick={onExitDriveMode}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>

        {/* Safety Instruction Banner */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center justify-center gap-2 text-center">
          <span className="text-[11px] font-bold text-amber-300">
            ⚠️ Please obey the traffic and obey the rules with others instructions.
          </span>
        </div>
      </div>

      {/* Center Track Details & Large Artwork */}
      <div className="flex flex-col items-center text-center my-auto py-6">
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 mb-6 bg-zinc-950">
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white line-clamp-2 px-4">
          {currentTrack.title}
        </h1>
        <p className="text-lg sm:text-xl font-semibold text-zinc-400 mt-2">
          {currentTrack.artist}
        </p>

        {/* Visualizer */}
        <div className="w-64 h-12 mt-4">
          <VisualizerCanvas
            isPlaying={isPlaying}
            type="bars"
            color="#ffffff"
            barCount={24}
          />
        </div>
      </div>

      {/* Massive Oversized Controls */}
      <div className="max-w-md mx-auto w-full pb-8">
        <div className="flex items-center justify-between gap-4">
          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(currentTrack.id)}
            className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-rose-500 active:scale-90 transition-all cursor-pointer"
          >
            <Heart
              className={`w-8 h-8 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Prev */}
          <button
            onClick={onPrevTrack}
            className="w-20 h-20 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg cursor-pointer"
          >
            <SkipBack className="w-10 h-10 fill-current" />
          </button>

          {/* Big Center Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="w-24 h-24 rounded-2xl bg-white hover:bg-zinc-200 text-black flex items-center justify-center active:scale-95 transition-all shadow-2xl cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 fill-black" />
            ) : (
              <Play className="w-12 h-12 fill-black ml-1.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNextTrack}
            className="w-20 h-20 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg cursor-pointer"
          >
            <SkipForward className="w-10 h-10 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
