import React, { useState, useMemo } from 'react';
import {
  Play,
  Heart,
  MoreVertical,
  Shuffle,
  Folder as FolderIcon,
  FolderOpen,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  ListPlus,
  Smartphone,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Track, Playlist, ActiveView } from '../types';

interface TrackListProps {
  view: ActiveView;
  title: string;
  tracks: Track[];
  allPlaylists: Playlist[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onMakeOffline: (track: Track) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onOpenCreatePlaylist: () => void;
  onOpenLyrics: (track: Track) => void;
  onOpenTrackActions?: (track: Track) => void;
  onOpenArtwork?: (track: Track) => void;
  selectedPlaylist?: Playlist;
  onRemoveFromPlaylist?: (trackId: string, playlistId: string) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  view,
  title,
  tracks,
  allPlaylists,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onMakeOffline,
  onAddToPlaylist,
  onDeleteTrack,
  onPlayAll,
  onOpenLyrics,
  onOpenTrackActions,
  onOpenArtwork,
  selectedPlaylist,
  onRemoveFromPlaylist,
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'artist' | 'playCount' | 'duration'>('default');
  const [menuOpenTrackId, setMenuOpenTrackId] = useState<string | null>(null);
  const [playlistPickerTrackId, setPlaylistPickerTrackId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Group by folder for Folder view
  const folderGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const f = t.folder || 'Phone Storage';
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(t);
    });
    return Array.from(map.entries()).map(([folderName, folderTracks]) => ({
      name: folderName,
      tracks: folderTracks,
      count: folderTracks.length,
      totalDuration: folderTracks.reduce((acc, t) => acc + t.duration, 0),
    }));
  }, [tracks]);

  // Determine tracks to display
  const baseTracks = useMemo(() => {
    if (view === 'folder' && selectedFolder) {
      return tracks.filter((t) => (t.folder || 'Phone Storage') === selectedFolder);
    }
    return tracks;
  }, [view, selectedFolder, tracks]);

  // Sort and filter tracks
  const filtered = baseTracks.filter((t) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.folder.toLowerCase().includes(q)
    );
  });

  const sortedTracks = [...filtered].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'playCount') return (b.playCount || 0) - (a.playCount || 0);
    if (sortBy === 'duration') return b.duration - a.duration;
    return 0;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFolderBrowser = view === 'folder' && !selectedFolder;

  return (
    <div className="pb-32 px-4 sm:px-6 max-w-3xl mx-auto select-none font-sans">
      {/* View Header Bar */}
      <div className="my-4 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                {view.replace('_', ' ')}
              </span>
              {selectedFolder && (
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>All Folders</span>
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {selectedFolder ? selectedFolder : title}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isFolderBrowser ? (
                <span>{folderGroups.length} device folders · {tracks.length} total tracks</span>
              ) : (
                <span>
                  {sortedTracks.length} {sortedTracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                  {Math.round(sortedTracks.reduce((acc, t) => acc + t.duration, 0) / 60)} mins total
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons: Play All & Shuffle */}
          {!isFolderBrowser && (
            <div className="flex items-center gap-2">
              <button
                id="btn-play-all-tracks"
                onClick={() => onPlayAll(sortedTracks, false)}
                disabled={sortedTracks.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play All</span>
              </button>

              <button
                id="btn-shuffle-current-list"
                onClick={() => onPlayAll(sortedTracks, true)}
                disabled={sortedTracks.length === 0}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-zinc-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-zinc-300" />
                <span>Shuffle</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Sort Controls */}
        {!isFolderBrowser && (
          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
            <input
              type="text"
              placeholder="Filter tracks in view..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full sm:w-60 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-zinc-500"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as unknown as typeof sortBy)}
                className="text-xs bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-500"
              >
                <option value="default">Default Order</option>
                <option value="title">Title (A-Z)</option>
                <option value="artist">Artist (A-Z)</option>
                <option value="playCount">Most Played</option>
                <option value="duration">Longest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Folder Browser Grid */}
      {isFolderBrowser ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {folderGroups.map((group) => (
              <div
                key={group.name}
                id={`folder-card-${group.name}`}
                onClick={() => setSelectedFolder(group.name)}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center border border-zinc-700/60 group-hover:scale-105 transition-transform">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white">
                      {group.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {group.count} {group.count === 1 ? 'song' : 'songs'} · {Math.round(group.totalDuration / 60)} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAll(group.tracks, false);
                    }}
                    title="Play Folder"
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-white hover:text-black text-zinc-300 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : sortedTracks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800">
          <FolderIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">No tracks found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search filter or scan your local storage for songs.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedTracks.map((track) => {
            const isCurrent = currentTrackId === track.id;
            const isMenuOpen = menuOpenTrackId === track.id;

            return (
              <div
                key={track.id}
                id={`track-item-${track.id}`}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 ${
                  isCurrent
                    ? 'bg-zinc-800/90 border border-indigo-500/40 text-indigo-300 shadow-md'
                    : 'bg-zinc-900/60 hover:bg-white/5 border border-zinc-800/80 text-zinc-200'
                }`}
              >
                {/* Left: Index / Cover / Info */}
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onPlayTrack(track)}
                >
                  {/* Track Artwork / Play indicator */}
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800">
                    <img
                      src={track.coverArt}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />

                    {isCurrent ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        {isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3.5">
                            <span className="w-1 bg-indigo-400 animate-pulse h-full rounded" />
                            <span className="w-1 bg-indigo-400 animate-pulse h-2/3 rounded" />
                            <span className="w-1 bg-indigo-400 animate-pulse h-4/5 rounded" />
                          </div>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-indigo-400 font-bold' : 'text-zinc-100 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      {track.sourceType === 'user-upload' && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          DEVICE
                        </span>
                      )}
                      {track.bitrate && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {track.bitrate.includes('Lossless') || track.bitrate.includes('FLAC') ? 'FLAC' : '320k'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 truncate mt-0.5">
                      <span className="truncate">{track.artist}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="truncate text-zinc-500 hidden sm:inline">{track.folder}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Duration, Favorite Heart, More Actions Menu */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                  {/* Offline status icon */}
                  {track.isOffline && (
                    <span
                      title="Available Offline"
                      className="p-1 text-emerald-400/80"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {/* Favorite Button */}
                  <button
                    id={`btn-fav-${track.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(track.id);
                    }}
                    title={track.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        track.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  {/* Duration */}
                  <span className="text-xs font-mono text-zinc-500 w-10 text-right">
                    {formatDuration(track.duration)}
                  </span>

                  {/* More Dropdown trigger */}
                  <div className="relative">
                    <button
                      id={`btn-track-menu-${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenTrackActions) {
                          onOpenTrackActions(track);
                        } else {
                          setMenuOpenTrackId(isMenuOpen ? null : track.id);
                          setPlaylistPickerTrackId(null);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
