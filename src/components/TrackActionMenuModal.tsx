import React, { useState } from 'react';
import {
  X,
  SkipForward,
  PlusSquare,
  ListPlus,
  Bell,
  Scissors,
  Image as ImageIcon,
  Share2,
  Trash2,
  Check,
  Plus,
  Music,
  FolderPlus
} from 'lucide-react';
import { Track, Playlist, AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';

interface TrackActionMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  currentTheme?: AppTheme;
  onPlayNext: (track: Track) => void;
  onEnqueue: (track: Track) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  onCreatePlaylistWithTrack: (trackId: string) => void;
  onOpenRingtone: (track: Track) => void;
  onOpenTrim: (track: Track) => void;
  onOpenArtwork: (track: Track) => void;
  onShare: (track: Track) => void;
  onDelete: (track: Track) => void;
}

export const TrackActionMenuModal: React.FC<TrackActionMenuModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  currentTheme = 'dark-amoled',
  onPlayNext,
  onEnqueue,
  onAddToPlaylist,
  onCreatePlaylistWithTrack,
  onOpenRingtone,
  onOpenTrim,
  onOpenArtwork,
  onShare,
  onDelete,
}) => {
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const theme = getThemeConfig(currentTheme);

  if (!isOpen || !track) return null;

  return (
    <div
      id="track-action-menu-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#16181d] sm:rounded-2xl rounded-t-3xl border-t sm:border border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col text-zinc-100 animate-in slide-in-from-bottom-5 duration-250"
        style={{
          backgroundColor: theme.isDark ? '#14161b' : '#ffffff',
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Drag Bar */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-600/70" />
        </div>

        {/* Top Info Header */}
        <div className="px-5 pt-3 pb-4 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 shadow-md bg-zinc-900 flex items-center justify-center">
              {track.coverArt ? (
                <img
                  src={track.coverArt}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Music className="w-5 h-5 text-zinc-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold truncate leading-tight">
                {track.title}
              </h3>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                {track.artist || '<unknown>'} · {track.album || 'Single'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800/60 transition-colors ml-2 cursor-pointer"
            style={{ color: theme.textSecondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN 4x2 ACTION GRID (Matching uploaded image) */}
        {!showPlaylistSubmenu ? (
          <div className="p-4 sm:p-6 grid grid-cols-4 gap-y-6 gap-x-2 text-center">
            {/* 1. Play next */}
            <button
              id="btn-action-play-next"
              onClick={() => {
                onPlayNext(track);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <SkipForward className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Play next
              </span>
            </button>

            {/* 2. Add to */}
            <button
              id="btn-action-add-to"
              onClick={() => setShowPlaylistSubmenu(true)}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusSquare className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Add to
              </span>
            </button>

            {/* 3. Enqueue */}
            <button
              id="btn-action-enqueue"
              onClick={() => {
                onEnqueue(track);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ListPlus className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Enqueue
              </span>
            </button>

            {/* 4. Ringtone */}
            <button
              id="btn-action-ringtone"
              onClick={() => {
                onClose();
                onOpenRingtone(track);
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Ringtone
              </span>
            </button>

            {/* 5. Trim */}
            <button
              id="btn-action-trim"
              onClick={() => {
                onClose();
                onOpenTrim(track);
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scissors className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Trim
              </span>
            </button>

            {/* 6. Artwork (Upload from Phone Gallery / Camera) */}
            <button
              id="btn-action-artwork"
              onClick={() => {
                onClose();
                onOpenArtwork(track);
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <ImageIcon className="w-7 h-7 stroke-[1.5] text-amber-400 group-hover:text-amber-300" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <span className="text-xs font-medium tracking-tight text-amber-300 group-hover:text-white line-clamp-1">
                Artwork
              </span>
            </button>

            {/* 7. Share */}
            <button
              id="btn-action-share"
              onClick={() => {
                onShare(track);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Share2 className="w-7 h-7 stroke-[1.5] text-zinc-100 group-hover:text-white" />
              </div>
              <span className="text-xs font-medium tracking-tight text-zinc-200 group-hover:text-white line-clamp-1">
                Share
              </span>
            </button>

            {/* 8. Delete */}
            <button
              id="btn-action-delete"
              onClick={() => {
                onDelete(track);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-7 h-7 stroke-[1.5] text-rose-400 group-hover:text-rose-300" />
              </div>
              <span className="text-xs font-medium tracking-tight text-rose-400 group-hover:text-rose-300 line-clamp-1">
                Delete
              </span>
            </button>
          </div>
        ) : (
          /* SUBMENU: ADD TO PLAYLIST */
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Add to Playlist
              </span>
              <button
                onClick={() => setShowPlaylistSubmenu(false)}
                className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                ‹ Back to options
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              <button
                onClick={() => {
                  onCreatePlaylistWithTrack(track.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-bold">+ Create New Playlist</span>
              </button>

              {playlists.map((pl) => {
                const isAlreadyIn = pl.trackIds.includes(track.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      onAddToPlaylist(track.id, pl.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left cursor-pointer ${
                      isAlreadyIn
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: pl.color || '#6366f1' }}
                      />
                      <span className="text-xs font-semibold truncate">{pl.name}</span>
                    </div>

                    {isAlreadyIn ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <Plus className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
