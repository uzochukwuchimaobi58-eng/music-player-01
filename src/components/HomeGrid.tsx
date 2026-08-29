import React from 'react';
import {
  Music,
  Folder,
  Heart,
  History,
  Clock,
  Activity,
  Plus,
  ChevronRight,
  ListMusic,
  Shuffle,
  Sparkles,
  Play,
  Smartphone,
  FolderSync
} from 'lucide-react';
import { Track, Playlist, ActiveView } from '../types';

interface HomeGridProps {
  tracks: Track[];
  playlists: Playlist[];
  onSelectView: (view: ActiveView, playlistId?: string) => void;
  onOpenCreatePlaylist: () => void;
  onShuffleAll: () => void;
  onPlayTrack: (track: Track) => void;
  onOpenScanModal: () => void;
}

export const HomeGrid: React.FC<HomeGridProps> = ({
  tracks,
  playlists,
  onSelectView,
  onOpenCreatePlaylist,
  onShuffleAll,
  onPlayTrack,
  onOpenScanModal,
}) => {
  // Compute counts
  const libraryCount = tracks.length;
  const folders = Array.from(new Set(tracks.map((t) => t.folder || 'Phone Storage')));
  const folderCount = folders.length;
  const favoriteCount = tracks.filter((t) => t.isFavorite).length;
  const recentPlayCount = tracks.filter((t) => (t.playCount || 0) > 0 || t.lastPlayed).length;
  const recentAddCount = tracks.length;
  const mostPlayCount = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const userPhoneTracks = tracks.filter((t) => t.sourceType === 'user-upload');

  const primaryCards = [
    {
      id: 'card-library',
      title: 'LIBRARY',
      count: libraryCount,
      bgColor: 'bg-[#3b82f6]', // Blue
      hoverColor: 'hover:bg-[#2563eb]',
      icon: Music,
      view: 'library' as ActiveView,
    },
    {
      id: 'card-folder',
      title: 'FOLDER',
      count: folderCount,
      bgColor: 'bg-[#e28743]', // Warm Orange / Tan
      hoverColor: 'hover:bg-[#d97706]',
      icon: Folder,
      view: 'folder' as ActiveView,
    },
    {
      id: 'card-favorite',
      title: 'FAVORITE',
      count: favoriteCount,
      bgColor: 'bg-[#e06d77]', // Dusty Coral Pink
      hoverColor: 'hover:bg-[#d15863]',
      icon: Heart,
      view: 'favorite' as ActiveView,
    },
    {
      id: 'card-recent-play',
      title: 'RECENT PLAY',
      count: recentPlayCount,
      bgColor: 'bg-[#5b9bb7]', // Steel Teal
      hoverColor: 'hover:bg-[#4a89a5]',
      icon: History,
      view: 'recent_play' as ActiveView,
    },
    {
      id: 'card-recent-add',
      title: 'RECENT ADD',
      count: recentAddCount,
      bgColor: 'bg-[#29ab78]', // Emerald Green
      hoverColor: 'hover:bg-[#228f64]',
      icon: Clock,
      view: 'recent_add' as ActiveView,
    },
    {
      id: 'card-most-play',
      title: 'MOST PLAY',
      count: mostPlayCount,
      bgColor: 'bg-[#9d78d2]', // Purple
      hoverColor: 'hover:bg-[#8862bf]',
      icon: Activity,
      view: 'most_play' as ActiveView,
    },
  ];

  return (
    <div className="relative pb-28 pt-3 px-4 sm:px-6 max-w-3xl mx-auto select-none font-sans">
      {/* Automatic Phone Music Auto-Indexed Hero Banner */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Phone Storage Auto-Indexed
              </h3>
              <span className="text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {libraryCount} songs loaded from phone folders & memory
            </p>
          </div>
        </div>

        <button
          id="btn-quick-auto-scan"
          onClick={onOpenScanModal}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Music className="w-3.5 h-3.5 text-black" />
          <span>Scan Music</span>
        </button>
      </div>

      {/* 6 Category Tiles Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-7">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              id={card.id}
              onClick={() => onSelectView(card.view)}
              className={`${card.bgColor} ${card.hoverColor} relative rounded-xl p-3.5 sm:p-4 aspect-[1/1] sm:aspect-[1.1/1] flex flex-col justify-between items-center text-white shadow-lg active:scale-95 transition-all duration-150 text-left group overflow-hidden border border-white/10 cursor-pointer`}
            >
              {/* Badge count top right */}
              <div className="w-full flex justify-end">
                <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider opacity-90 px-1.5 py-0.5 rounded bg-black/20">
                  {card.count}
                </span>
              </div>

              {/* Big Center Icon */}
              <div className="flex-1 flex items-center justify-center my-0.5">
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow group-hover:scale-110 transition-transform duration-200" />
              </div>

              {/* Card Label bottom */}
              <div className="w-full text-center">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase drop-shadow-xs">
                  {card.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Playlists Section */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
              PLAYLISTS ({playlists.length})
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-create-playlist-header"
              onClick={onOpenCreatePlaylist}
              title="Create new playlist"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectView('library')}
              title="View all"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playlist Tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              id={`playlist-tile-${pl.id}`}
              onClick={() => onSelectView('playlist_detail', pl.id)}
              className="group relative cursor-pointer flex flex-col rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-md"
            >
              {/* Playlist Cover Image / Graphic */}
              <div className={`relative aspect-square w-full bg-gradient-to-br ${pl.color || 'from-zinc-800 to-zinc-950'} flex flex-col items-center justify-center text-white p-3`}>
                <span className="absolute top-2 right-2 text-[10px] font-mono font-bold text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded">
                  {pl.trackIds.length}
                </span>
                <ListMusic className="w-8 h-8 sm:w-9 sm:h-9 text-zinc-200 group-hover:scale-110 transition-transform duration-200" />
              </div>

              {/* Playlist Title bar */}
              <div className="p-2.5 bg-zinc-950 text-center border-t border-zinc-800/60">
                <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                  {pl.name}
                </p>
              </div>
            </div>
          ))}

          {/* Add Playlist Tile */}
          <button
            id="btn-add-playlist-tile"
            onClick={onOpenCreatePlaylist}
            className="flex flex-col items-center justify-center aspect-square rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800/80 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-2 text-zinc-400 group-hover:text-zinc-200">New Playlist</span>
          </button>
        </div>
      </div>

      {/* Suggested Tracks Preview */}
      <div className="mt-5 px-0.5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
            Recent Tracks
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            HI-RES LOSSLESS
          </span>
        </div>

        <div className="space-y-1.5">
          {tracks.slice(0, 4).map((track, i) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-white/5 border border-zinc-800/80 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-xs font-mono text-zinc-500 w-4 text-center group-hover:text-zinc-300">
                  0{i + 1}
                </span>
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/50">
                  <img
                    src={track.coverArt}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
                    {track.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {track.artist} · <span className="text-zinc-600">{track.folder}</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 shrink-0 ml-2">
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) - Shuffle button */}
      <button
        id="btn-fab-shuffle-all"
        onClick={onShuffleAll}
        title="Shuffle and play all songs"
        className="fixed bottom-20 sm:bottom-24 right-5 sm:right-8 z-30 w-13 h-13 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-2xl active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer"
      >
        <Shuffle className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
