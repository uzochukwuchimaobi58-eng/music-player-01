import React from 'react';
import { Play, Pause, SkipForward, ListMusic, Music } from 'lucide-react';
import { Track, AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTheme?: AppTheme;
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
  currentTheme = 'dark-amoled',
  onTogglePlay,
  onNextTrack,
  onOpenFullPlayer,
  onOpenQueue,
}) => {
  if (!currentTrack) return null;

  const theme = getThemeConfig(currentTheme);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="mini-player-bar"
      style={{
        backgroundColor: theme.miniPlayerBg,
        borderColor: theme.miniPlayerBorder,
        color: theme.textPrimary,
      }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t select-none shadow-2xl transition-colors duration-300 font-sans"
    >
      {/* Top Precision Progress Line */}
      <div className="relative w-full h-[2px] bg-zinc-800/80">
        <div
          id="mini-player-progress"
          className="h-full shadow-xs transition-all duration-150"
          style={{
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
            backgroundColor: theme.accentColor,
          }}
        />
      </div>

      <div className="max-w-xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-3">
        {/* Left & Middle: Artwork Box & Track Info (Click opens full player) */}
        <div
          id="mini-player-tap-area"
          onClick={onOpenFullPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          {/* Square Cover Box */}
          <div className="relative w-11 h-11 rounded-md overflow-hidden shrink-0 border border-zinc-700/60 shadow-md bg-zinc-800 flex items-center justify-center">
            {currentTrack.coverArt ? (
              <img
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Music className="w-5 h-5 text-zinc-400" />
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold truncate group-hover:opacity-80 transition-opacity"
              style={{ color: theme.textPrimary }}
            >
              {currentTrack.title || 'coins earn'}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: theme.textSecondary }}
            >
              {currentTrack.artist && currentTrack.artist !== 'Unknown'
                ? currentTrack.artist
                : '<unknown>'}
            </p>
          </div>
        </div>

        {/* Right: Controls (Play/Pause, Next, Queue) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="btn-mini-play-pause"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            style={{ color: theme.textPrimary }}
            className="p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current stroke-current" />
            ) : (
              <Play className="w-6 h-6 fill-current stroke-current ml-0.5" />
            )}
          </button>

          <button
            id="btn-mini-next"
            onClick={(e) => {
              e.stopPropagation();
              onNextTrack();
            }}
            style={{ color: theme.textPrimary }}
            className="p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current stroke-current" />
          </button>

          <button
            id="btn-mini-queue"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQueue();
            }}
            style={{ color: theme.textPrimary }}
            className="p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
            title="Current Queue"
          >
            <ListMusic className="w-6 h-6 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Bottom Thin Persistent Progress Line (0 extra vertical space) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800/40 pointer-events-none overflow-hidden">
        <div
          id="mini-player-bottom-progress"
          className="h-full shadow-xs transition-all duration-150"
          style={{
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
            backgroundColor: theme.accentColor,
          }}
        />
      </div>
    </div>
  );
};
