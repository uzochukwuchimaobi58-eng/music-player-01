import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  MoreVertical,
  Shuffle,
  Play,
  Music,
  FolderOpen,
  Disc3,
  User,
  Radio,
  X,
  SlidersHorizontal,
  Moon,
  FolderSync,
  Check,
  Palette
} from 'lucide-react';
import { Track, AppTheme } from '../types';
import { THEMES, ThemeDefinition } from '../data/themes';

export type LibrarySubTab = 'tracks' | 'artists' | 'albums' | 'genres' | 'folders';

interface LibraryViewProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  initialTab?: LibrarySubTab;
  onBackToHome: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onOpenTrackActions: (track: Track) => void;
  onOpenEqualizer: () => void;
  onOpenScanModal: () => void;
  onOpenSleepTimer: () => void;
  onOpenThemeModal?: () => void;
  currentTheme?: AppTheme;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  initialTab = 'tracks',
  onBackToHome,
  onPlayTrack,
  onPlayAll,
  onOpenTrackActions,
  onOpenEqualizer,
  onOpenScanModal,
  onOpenSleepTimer,
  onOpenThemeModal,
  currentTheme = 'dark-amoled',
}) => {
  const [activeTab, setActiveTab] = useState<LibrarySubTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'artist' | 'dateAdded' | 'duration'>('default');

  // Dynamic Theme resolution (not permanent or hardcoded!)
  const theme: ThemeDefinition = THEMES[currentTheme] || THEMES['dark-amoled'];

  // Drill-down selection within sub-tabs
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Pagination for smooth performance with large track lists
  const [visibleCount, setVisibleCount] = useState<number>(80);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Switch sub-tabs cleanly
  const handleTabChange = (tab: LibrarySubTab) => {
    setActiveTab(tab);
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSelectedGenre(null);
    setSelectedFolder(null);
    setVisibleCount(80);
  };

  // Groupings for Artists
  const artistGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const artist = t.artist && t.artist !== 'Unknown' ? t.artist : 'Unknown Artist';
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist)!.push(t);
    });
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name,
        tracks: items,
        count: items.length,
        coverArt: items[0]?.coverArt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  // Groupings for Albums
  const albumGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const album = t.album && t.album !== 'Unknown' ? t.album : 'Unknown Album';
      if (!map.has(album)) map.set(album, []);
      map.get(album)!.push(t);
    });
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name,
        artist: items[0]?.artist || 'Various Artists',
        tracks: items,
        count: items.length,
        coverArt: items[0]?.coverArt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  // Groupings for Genres
  const genreGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const titleLower = t.title.toLowerCase();
      const artistLower = t.artist.toLowerCase();
      let genre = t.genre || 'Afrobeats';
      if (titleLower.includes('praise') || titleLower.includes('gospel') || titleLower.includes('worship')) {
        genre = 'Gospel';
      } else if (titleLower.includes('highlife') || artistLower.includes('kcee') || artistLower.includes('phyno')) {
        genre = 'Highlife';
      } else if (titleLower.includes('remix') || titleLower.includes('edm') || titleLower.includes('bass')) {
        genre = 'Electronic & Dance';
      } else if (titleLower.includes('rap') || titleLower.includes('freestyle') || artistLower.includes('odumodublvck')) {
        genre = 'Hip Hop';
      } else if (titleLower.includes('love') || titleLower.includes('slow') || artistLower.includes('boy')) {
        genre = 'R&B / Soul';
      }
      if (!map.has(genre)) map.set(genre, []);
      map.get(genre)!.push(t);
    });
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name,
        tracks: items,
        count: items.length,
        coverArt: items[0]?.coverArt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  // Groupings for Folders
  const folderGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const folder = t.folder || '/storage/emulated/0/Music';
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(t);
    });
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name,
        tracks: items,
        count: items.length,
        coverArt: items[0]?.coverArt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  // Determine active list of tracks based on drill-down or active tab
  const currentBaseTracks = useMemo(() => {
    if (activeTab === 'artists' && selectedArtist) {
      return artistGroups.find((g) => g.name === selectedArtist)?.tracks || [];
    }
    if (activeTab === 'albums' && selectedAlbum) {
      return albumGroups.find((g) => g.name === selectedAlbum)?.tracks || [];
    }
    if (activeTab === 'genres' && selectedGenre) {
      return genreGroups.find((g) => g.name === selectedGenre)?.tracks || [];
    }
    if (activeTab === 'folders' && selectedFolder) {
      return folderGroups.find((g) => g.name === selectedFolder)?.tracks || [];
    }
    return tracks;
  }, [
    activeTab,
    selectedArtist,
    selectedAlbum,
    selectedGenre,
    selectedFolder,
    artistGroups,
    albumGroups,
    genreGroups,
    folderGroups,
    tracks,
  ]);

  // Search filter
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return currentBaseTracks;
    const q = searchQuery.toLowerCase();
    return currentBaseTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [currentBaseTracks, searchQuery]);

  // Sorting
  const sortedTracks = useMemo(() => {
    const list = [...filteredTracks];
    if (sortBy === 'title') return list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'artist') return list.sort((a, b) => a.artist.localeCompare(b.artist));
    if (sortBy === 'duration') return list.sort((a, b) => b.duration - a.duration);
    if (sortBy === 'dateAdded') return list.sort((a, b) => b.dateAdded - a.dateAdded);
    return list;
  }, [filteredTracks, sortBy]);

  const visibleTracks = useMemo(() => {
    return sortedTracks.slice(0, visibleCount);
  }, [sortedTracks, visibleCount]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(sortedTracks.length, prev + 60));
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sortedTracks.length]);

  const isDrillDown =
    (activeTab === 'artists' && !!selectedArtist) ||
    (activeTab === 'albums' && !!selectedAlbum) ||
    (activeTab === 'genres' && !!selectedGenre) ||
    (activeTab === 'folders' && !!selectedFolder);

  const getDrillDownTitle = () => {
    if (selectedArtist) return selectedArtist;
    if (selectedAlbum) return selectedAlbum;
    if (selectedGenre) return selectedGenre;
    if (selectedFolder) return selectedFolder.split('/').pop() || selectedFolder;
    return 'MUSIC LIBRARY';
  };

  return (
    <div
      id="library-main-container"
      className="relative min-h-screen pb-32 select-none font-sans overflow-x-hidden transition-colors duration-300"
      style={{
        background: theme.bgCanvas,
        color: theme.textPrimary,
      }}
    >
      {/* ========================================================================= */}
      {/* MUSIC LIBRARY UPPER SECTION (Unifying Header & Sub-Tabs Navigation)       */}
      {/* ========================================================================= */}
      <div
        id="library-upper-section"
        className="sticky top-0 z-40 border-b backdrop-blur-md shadow-md transition-colors duration-300"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.headerBorder,
        }}
      >
        {/* ROW 1: TOP BAR (Back button, Title, Search, and 3-Dots Menu) */}
        <header className="px-3 sm:px-4 py-2.5 flex items-center justify-between">
          {/* Left: Back Arrow and Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="btn-library-back"
              onClick={() => {
                if (isDrillDown) {
                  setSelectedArtist(null);
                  setSelectedAlbum(null);
                  setSelectedGenre(null);
                  setSelectedFolder(null);
                } else {
                  onBackToHome();
                }
              }}
              aria-label="Back"
              style={{ color: theme.textPrimary }}
              className="p-1.5 -ml-1 hover:opacity-80 active:scale-95 transition-transform cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <h1
              className="text-lg sm:text-xl font-bold tracking-tight uppercase truncate"
              style={{ color: theme.textPrimary }}
            >
              {isDrillDown ? getDrillDownTitle() : 'MUSIC LIBRARY'}
            </h1>
          </div>

          {/* Right Action Icons: Search & Three Dots Menu (NO Ads log/icon) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search Toggle */}
            <button
              id="btn-library-search-toggle"
              onClick={() => setShowSearchInput(!showSearchInput)}
              aria-label="Search Tracks"
              style={{ color: theme.textPrimary }}
              className="p-2 hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Three Dots Menu (⋮) */}
            <div className="relative">
              <button
                id="btn-library-menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Options"
                style={{ color: theme.textPrimary }}
                className="p-2 hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
              >
                <MoreVertical className="w-5 h-5 stroke-[2.2]" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-56 rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-zinc-400 border-b border-zinc-800">
                      Library Options
                    </div>

                    {/* Change Theme & UI Style option */}
                    {onOpenThemeModal && (
                      <button
                        id="btn-menu-change-theme"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenThemeModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 cursor-pointer text-amber-400 font-semibold"
                      >
                        <Palette className="w-4 h-4 text-amber-400" />
                        <span>Change Theme & UI Style</span>
                      </button>
                    )}

                    <div className="px-3 pt-2 pb-1 font-bold uppercase tracking-wider text-[10px] text-zinc-400 border-t border-zinc-800">
                      Sort Tracks
                    </div>

                    <button
                      onClick={() => {
                        setSortBy('title');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-zinc-800 cursor-pointer ${
                        sortBy === 'title' ? 'text-amber-400 font-bold' : ''
                      }`}
                    >
                      <span>Title (A-Z)</span>
                      {sortBy === 'title' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <button
                      onClick={() => {
                        setSortBy('artist');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-zinc-800 cursor-pointer ${
                        sortBy === 'artist' ? 'text-amber-400 font-bold' : ''
                      }`}
                    >
                      <span>Artist (A-Z)</span>
                      {sortBy === 'artist' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <button
                      onClick={() => {
                        setSortBy('dateAdded');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-zinc-800 cursor-pointer ${
                        sortBy === 'dateAdded' ? 'text-amber-400 font-bold' : ''
                      }`}
                    >
                      <span>Recently Added</span>
                      {sortBy === 'dateAdded' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <div className="h-px bg-zinc-800 my-1" />

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenScanModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 cursor-pointer"
                    >
                      <FolderSync className="w-4 h-4 text-emerald-400" />
                      <span>Scan Music Storage</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenEqualizer();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                      <span>Equalizer & FX</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSleepTimer();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 cursor-pointer"
                    >
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Sleep Timer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Smooth Search Input Bar (when toggled) */}
        {showSearchInput && (
          <div className="px-3 sm:px-4 py-2 border-t border-black/10 animate-in slide-in-from-top-1 duration-150">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 opacity-60" style={{ color: theme.textSecondary }} />
              <input
                id="library-search-input"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, albums..."
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  color: theme.textPrimary,
                  borderColor: theme.headerBorder,
                }}
                className="w-full pl-9 pr-8 py-2 rounded-lg border text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ color: theme.textSecondary }}
                  className="absolute right-2.5 p-1 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ROW 2: SUB-TABS NAVIGATION BAR INSIDE THE MUSIC LIBRARY UPPER SECTION */}
        {/* TRACKS | ARTISTS | ALBUMS | GENRES | FOLDERS */}
        <nav
          id="library-subtabs-navbar"
          aria-label="Library sub-tabs"
          className="flex items-center px-1 sm:px-3 overflow-x-auto scrollbar-none border-t border-black/10"
        >
          <div className="flex items-center min-w-full justify-between sm:justify-start sm:gap-6 px-1">
            {(
              [
                { key: 'tracks', label: 'TRACKS' },
                { key: 'artists', label: 'ARTISTS' },
                { key: 'albums', label: 'ALBUMS' },
                { key: 'genres', label: 'GENRES' },
                { key: 'folders', label: 'FOLDERS' },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`tab-library-${tab.key}`}
                  onClick={() => handleTabChange(tab.key)}
                  style={{
                    color: isActive ? theme.accentColor : theme.textSecondary,
                  }}
                  className={`relative py-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold tracking-wider transition-colors cursor-pointer uppercase shrink-0 hover:opacity-100 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1 right-1 h-[2.5px] rounded-full shadow-xs transition-all"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="px-2 pt-2 sm:px-4 max-w-5xl mx-auto">
        {/* Drill-down return bar with "Play All" and "Shuffle" for the selected group */}
        {isDrillDown && (
          <div className="flex items-center justify-between px-3 py-2.5 my-2 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => {
                setSelectedArtist(null);
                setSelectedAlbum(null);
                setSelectedGenre(null);
                setSelectedFolder(null);
              }}
              style={{ color: theme.accentColor }}
              className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to all {activeTab}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] opacity-75" style={{ color: theme.textSecondary }}>
                {sortedTracks.length} {sortedTracks.length === 1 ? 'song' : 'songs'}
              </span>
              <button
                onClick={() => onPlayAll(sortedTracks, false)}
                style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={() => onPlayAll(sortedTracks, true)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-95 transition-transform"
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 1. TRACKS TAB (Full track list with artwork, play, and options) */}
        {(activeTab === 'tracks' || isDrillDown) && (
          <div className="space-y-0.5">
            {sortedTracks.length === 0 ? (
              <div className="text-center py-20 px-4">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: theme.textSecondary }} />
                <p className="text-base font-bold" style={{ color: theme.textPrimary }}>No tracks found</p>
                <p className="text-xs mt-1 opacity-70" style={{ color: theme.textSecondary }}>
                  Try scanning your device storage or adding songs.
                </p>
                <button
                  onClick={onOpenScanModal}
                  style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                  className="mt-4 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  Scan Device Music
                </button>
              </div>
            ) : (
              visibleTracks.map((track) => {
                const isCurrent = currentTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    id={`library-track-${track.id}`}
                    onClick={() => onPlayTrack(track)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer group active:bg-white/10 ${
                      isCurrent ? 'bg-black/30' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Left: Square Cover Art Thumbnail */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10 shadow-sm flex items-center justify-center">
                      {track.coverArt ? (
                        <img
                          src={track.coverArt}
                          alt={track.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Music className="w-6 h-6 opacity-40" style={{ color: theme.textSecondary }} />
                      )}

                      {/* Playing Animated Indicator */}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          {isPlaying ? (
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-1 animate-pulse h-full rounded" style={{ backgroundColor: theme.accentColor }} />
                              <span className="w-1 animate-pulse h-2/3 rounded" style={{ backgroundColor: theme.accentColor }} />
                              <span className="w-1 animate-pulse h-4/5 rounded" style={{ backgroundColor: theme.accentColor }} />
                            </div>
                          ) : (
                            <Play className="w-4 h-4 ml-0.5 fill-current" style={{ color: theme.accentColor }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle: Title & Artist info */}
                    <div className="min-w-0 flex-1 ml-3 pr-2">
                      <p
                        className="text-sm font-semibold truncate leading-tight"
                        style={{ color: isCurrent ? theme.accentColor : theme.textPrimary }}
                      >
                        {track.title}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5 font-normal opacity-75"
                        style={{ color: theme.textSecondary }}
                      >
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>

                    {/* Right: Three Dots Action Menu */}
                    <button
                      id={`btn-menu-track-${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTrackActions(track);
                      }}
                      aria-label="Track options"
                      style={{ color: theme.textSecondary }}
                      className="p-2 hover:opacity-100 active:scale-95 transition-transform cursor-pointer shrink-0"
                    >
                      <MoreVertical className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                );
              })
            )}

            {/* Pagination Sentinel */}
            {visibleCount < sortedTracks.length && (
              <div ref={sentinelRef} className="py-4 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(sortedTracks.length, prev + 80))}
                  className="px-4 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 text-xs font-medium"
                  style={{ color: theme.textSecondary }}
                >
                  Load more tracks ({visibleTracks.length} of {sortedTracks.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. ARTISTS TAB */}
        {activeTab === 'artists' && !isDrillDown && (
          <div className="space-y-1">
            {artistGroups.map((artist) => (
              <div
                key={artist.name}
                id={`artist-row-${artist.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedArtist(artist.name)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                    {artist.coverArt ? (
                      <img
                        src={artist.coverArt}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 opacity-60" style={{ color: theme.textSecondary }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
                      {artist.name}
                    </p>
                    <p className="text-xs opacity-75" style={{ color: theme.textSecondary }}>
                      {artist.count} {artist.count === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAll(artist.tracks, false);
                    }}
                    title={`Play all songs by ${artist.name}`}
                    style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                    className="p-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. ALBUMS TAB */}
        {activeTab === 'albums' && !isDrillDown && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
            {albumGroups.map((album) => (
              <div
                key={album.name}
                id={`album-card-${album.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedAlbum(album.name)}
                className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 transition-all cursor-pointer group flex flex-col"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 mb-2 relative">
                  {album.coverArt ? (
                    <img
                      src={album.coverArt}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-8 h-8 opacity-40" style={{ color: theme.textSecondary }} />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAll(album.tracks, false);
                    }}
                    style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
                    title={`Play ${album.name}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
                <p className="text-xs font-bold truncate" style={{ color: theme.textPrimary }}>
                  {album.name}
                </p>
                <p className="text-[11px] truncate opacity-75" style={{ color: theme.textSecondary }}>
                  {album.artist}
                </p>
                <p className="text-[10px] mt-0.5 opacity-60" style={{ color: theme.textSecondary }}>
                  {album.count} songs
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 4. GENRES TAB */}
        {activeTab === 'genres' && !isDrillDown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1">
            {genreGroups.map((genre) => (
              <div
                key={genre.name}
                id={`genre-card-${genre.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedGenre(genre.name)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0"
                    style={{ color: theme.accentColor }}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate" style={{ color: theme.textPrimary }}>
                      {genre.name}
                    </h4>
                    <p className="text-xs opacity-75" style={{ color: theme.textSecondary }}>
                      {genre.count} {genre.count === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAll(genre.tracks, false);
                  }}
                  title={`Play ${genre.name}`}
                  style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                  className="p-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 5. FOLDERS TAB */}
        {activeTab === 'folders' && !isDrillDown && (
          <div className="space-y-1">
            {folderGroups.map((group) => {
              const displayName = group.name.split('/').pop() || group.name;
              return (
                <div
                  key={group.name}
                  id={`folder-row-${displayName.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedFolder(group.name)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center shrink-0"
                      style={{ color: theme.accentColor }}
                    >
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
                        {displayName}
                      </p>
                      <p className="text-xs truncate opacity-60" style={{ color: theme.textSecondary }}>
                        {group.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium opacity-75" style={{ color: theme.textSecondary }}>
                      {group.count} {group.count === 1 ? 'song' : 'songs'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayAll(group.tracks, false);
                      }}
                      title={`Play folder ${displayName}`}
                      style={{ backgroundColor: theme.accentColor, color: '#000000' }}
                      className="p-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTON (Shuffle button dynamically styled with active theme) */}
      <button
        id="btn-library-shuffle-fab"
        onClick={() => onPlayAll(sortedTracks.length > 0 ? sortedTracks : tracks, true)}
        aria-label="Shuffle tracks"
        style={{
          backgroundColor: theme.shuffleFab.bg,
          color: theme.shuffleFab.text,
          boxShadow: theme.shuffleFab.shadow,
        }}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-95 hover:scale-105 transition-all cursor-pointer border-2 border-white/20"
      >
        <Shuffle className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
