import React from 'react';
import { Play, Pause, SkipForward, ListMusic, Volume2, ShieldCheck } from 'lucide-react';
import { Track } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onOpenFullPlayer: () => void;
  onOpenQueue: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNextTrack,
  onOpenFullPlayer,
  onOpenQueue,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="mini-player-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-md select-none transition-all font-sans"
    >
      {/* Top Precision Progress Line */}
      <div className="relative w-full h-[2px] bg-zinc-800">
        <div
          id="mini-player-progress"
          className="h-full bg-white shadow-xs transition-all duration-150"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left & Middle: Album Disc & Track Info (Click opens full player) */}
        <div
          id="mini-player-tap-area"
          onClick={onOpenFullPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          {/* Spinning Disc / Artwork */}
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/80 shadow-md bg-zinc-900">
            <img
              src={currentTrack.coverArt}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
              {currentTrack.title}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Right: Controls (Play/Pause, Next, Queue) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-mini-play-pause"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="p-2 rounded-lg text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
          </button>

          <button
            id="btn-mini-next"
            onClick={(e) => {
              e.stopPropagation();
              onNextTrack();
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            id="btn-mini-queue"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQueue();
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title="Current Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
