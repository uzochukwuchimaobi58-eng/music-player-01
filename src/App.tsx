import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Track,
  Playlist,
  RepeatMode,
  AppTheme,
  ActiveView,
  EqualizerSettings,
  PlayerState,
} from './types';
import {
  loadStoredTracks,
  saveStoredTracks,
  loadStoredPlaylists,
  saveStoredPlaylists,
  loadStoredEq,
  saveStoredEq,
  loadStoredTheme,
  saveStoredTheme,
  storeAudioBlobOffline,
  getAudioBlobOffline,
  removeAudioBlobOffline,
  DEFAULT_EQ_SETTINGS,
} from './services/storage';
import {
  restoreTrackBlobUrls,
  autoScanStoredDirectory,
  scanAudioFiles,
} from './services/deviceScanner';
import { audioEngine, TrendingAudioEffect } from './services/audioEngine';
import { MusicLibrary } from './plugins/MusicLibrary';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeGrid } from './components/HomeGrid';
import { TrackList } from './components/TrackList';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { EqualizerModal } from './components/EqualizerModal';
import { ScanLibraryModal } from './components/ScanLibraryModal';
import { PlaylistModal } from './components/PlaylistModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { DriveModeView } from './components/DriveModeView';
import { LyricsModal } from './components/LyricsModal';
import { QueueModal } from './components/QueueModal';
import { ThemeModal } from './components/ThemeModal';
import { SettingsModal } from './components/SettingsModal';
import { RingtoneTrimmerModal } from './components/RingtoneTrimmerModal';
import { MonetizationProModal } from './components/MonetizationProModal';

export default function App() {
  // --- Persistent State ---
  const [tracks, setTracks] = useState<Track[]>(() => loadStoredTracks());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadStoredPlaylists());
  const [theme, setTheme] = useState<AppTheme>(() => loadStoredTheme());
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() => loadStoredEq());
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('sonance_pro_active') === 'true';
  });

  // --- UI Navigation State ---
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modals State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRingtoneOpen, setIsRingtoneOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isCachingAll, setIsCachingAll] = useState(false);
  const [autoSyncToast, setAutoSyncToast] = useState<string | null>(null);

  // --- Playback State & Trending FX ---
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(() => {
    return tracks.length > 0 ? tracks[0].id : null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [hiFiMode, setHiFiMode] = useState(true);
  const [activeTrendingEffect, setActiveTrendingEffect] = useState<TrendingAudioEffect>('normal');
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);

  // --- Active Queue State ---
  const [activeQueue, setActiveQueue] = useState<Track[]>(() => tracks);

  // --- Sleep Timer State ---
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  // Derive Current Track
  const currentTrack = useMemo(() => {
    return tracks.find((t) => t.id === currentTrackId) || tracks[0] || null;
  }, [tracks, currentTrackId]);

  // Derive Offline count
  const offlineCount = useMemo(() => {
    return tracks.filter((t) => t.isOffline).length;
  }, [tracks]);

  // Sync state to local storage
  useEffect(() => {
    saveStoredTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    saveStoredPlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    saveStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveStoredEq(eqSettings);
    audioEngine.applyEqualizer(eqSettings);
  }, [eqSettings]);

  // Restore persistent device audio blobs & auto-scan phone folders on startup via MusicLibrary.scanSongs()
  useEffect(() => {
    const initDeviceSync = async () => {
      try {
        const restored = await restoreTrackBlobUrls(tracks);
        setTracks(restored);

        // Native Android MediaStore Music Scan
        try {
          const scanResult = await MusicLibrary.scanSongs();
          if (scanResult && scanResult.songs && scanResult.songs.length > 0) {
            const nativeTracks: Track[] = scanResult.songs.map((s, idx) => ({
              id: `native-${s.id || idx}-${Date.now()}`,
              title: s.title,
              artist: s.artist,
              album: s.album,
              duration: Math.max(1, Math.round((s.duration || 0) / 1000)),
              url: s.uri,
              coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
              folder: s.album || 'Phone Music',
              isFavorite: false,
              playCount: 0,
              dateAdded: Date.now(),
              isOffline: true,
              sourceType: 'user-upload',
            }));

            setTracks((prev) => {
              const unique = nativeTracks.filter(
                (nt) => !prev.some((et) => et.title === nt.title && et.artist === nt.artist)
              );
              return unique.length > 0 ? [...unique, ...prev] : prev;
            });
            setAutoSyncToast(`Loaded ${scanResult.songs.length} phone songs from MediaStore`);
            setTimeout(() => setAutoSyncToast(null), 4000);
            return;
          }
        } catch (nativeErr) {
          console.debug('Native scanSongs info:', nativeErr);
        }

        // Auto-scan saved phone storage folders in web preview / browser fallback
        const autoScanned = await autoScanStoredDirectory();
        if (autoScanned.length > 0) {
          setTracks((prev) => {
            const unique = autoScanned.filter(
              (nt) => !prev.some((et) => et.title === nt.title && et.artist === nt.artist)
            );
            return unique.length > 0 ? [...unique, ...prev] : prev;
          });
          setAutoSyncToast(`Auto-synced ${autoScanned.length} phone songs`);
          setTimeout(() => setAutoSyncToast(null), 4000);
        } else {
          setAutoSyncToast(`Phone storage connected (${restored.length} tracks indexed)`);
          setTimeout(() => setAutoSyncToast(null), 3000);
        }
      } catch (err) {
        console.debug('Device sync info:', err);
      }
    };
    initDeviceSync();
  }, []);

  // Global drag-and-drop listener to auto-ingest audio files anywhere without clicking buttons
  useEffect(() => {
    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const audioFiles = Array.from(e.dataTransfer.files).filter(
          (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|opus|wma)$/i.test(f.name)
        );
        if (audioFiles.length > 0) {
          try {
            setAutoSyncToast(`Auto-importing ${audioFiles.length} audio tracks...`);
            const newTracks = await scanAudioFiles(audioFiles);
            if (newTracks.length > 0) {
              setTracks((prev) => {
                const unique = newTracks.filter(
                  (nt) => !prev.some((et) => et.title === nt.title && et.artist === nt.artist)
                );
                return unique.length > 0 ? [...unique, ...prev] : prev;
              });
              setAutoSyncToast(`Imported ${newTracks.length} tracks to library`);
              setTimeout(() => setAutoSyncToast(null), 4000);
            }
          } catch (err) {
            console.error('Auto import drop error:', err);
          }
        }
      }
    };

    const handleWindowDragOver = (e: DragEvent) => e.preventDefault();

    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragover', handleWindowDragOver);
    return () => {
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragover', handleWindowDragOver);
    };
  }, []);

  // --- Shake to Shuffle Gesture Control ---
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastTime = 0;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 300) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const deltaX = (current.x || 0) - lastX;
        const deltaY = (current.y || 0) - lastY;
        const deltaZ = (current.z || 0) - lastZ;

        const speed = (Math.abs(deltaX + deltaY + deltaZ) / diffTime) * 10000;

        if (speed > 800) {
          // Shake detected -> trigger next track with shuffle
          handleNextTrack();
          setAutoSyncToast('📳 Shake to Next Track');
          setTimeout(() => setAutoSyncToast(null), 2000);
        }

        lastX = current.x || 0;
        lastY = current.y || 0;
        lastZ = current.z || 0;
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [activeQueue, currentTrackId]);

  // --- Audio Element Event Bindings ---
  useEffect(() => {
    audioEngine.init();
    audioEngine.applyEqualizer(eqSettings);
    audioEngine.setVolume(isMuted ? 0 : volume);
    audioEngine.setPlaybackRate(playbackRate);

    const el = audioEngine.getAudioElement();
    if (!el) return;

    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('loadedmetadata', handleLoadedMetadata);
    el.addEventListener('ended', handleEnded);
    el.addEventListener('play', handlePlay);
    el.addEventListener('pause', handlePause);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('loadedmetadata', handleLoadedMetadata);
      el.removeEventListener('ended', handleEnded);
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('pause', handlePause);
    };
  }, []);

  // --- Sleep Timer Countdown Loop ---
  useEffect(() => {
    if (sleepTimerRemaining === null) {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      return;
    }

    if (sleepTimerRemaining <= 0) {
      audioEngine.pause();
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      return;
    }

    sleepTimerRef.current = window.setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          audioEngine.pause();
          setIsPlaying(false);
          return null;
        }
        // Soft fade out volume in last 30 seconds
        if (prev <= 30) {
          const fadeVol = (prev / 30) * volume;
          audioEngine.setVolume(Math.max(0, fadeVol));
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerRemaining, volume]);

  // Load and play track
  const loadAndPlayTrack = async (track: Track, autoPlay: boolean = true) => {
    setCurrentTrackId(track.id);

    // Update play stats
    setTracks((prev) =>
      prev.map((t) =>
        t.id === track.id
          ? {
              ...t,
              playCount: (t.playCount || 0) + 1,
              lastPlayed: Date.now(),
            }
          : t
      )
    );

    try {
      const cachedBlob = await getAudioBlobOffline(track.id);
      if (cachedBlob) {
        const localBlobUrl = URL.createObjectURL(cachedBlob);
        audioEngine.loadTrack(localBlobUrl);
      } else {
        audioEngine.loadTrack(track.url);
      }
    } catch {
      audioEngine.loadTrack(track.url);
    }

    if (autoPlay) {
      try {
        await audioEngine.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Play error:', err);
      }
    }
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) return;

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex((t) => t.id === currentTrackId);
    let nextIndex = 0;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * activeQueue.length);
    } else {
      nextIndex = (currentIndex + 1) % activeQueue.length;
    }

    loadAndPlayTrack(activeQueue[nextIndex], true);
  };

  const handlePrevTrack = () => {
    if (activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex((t) => t.id === currentTrackId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = activeQueue.length - 1;

    loadAndPlayTrack(activeQueue[prevIndex], true);
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }

    if (repeatMode === 'all') {
      handleNextTrack();
      return;
    }

    // Repeat off: stop at end of queue
    const currentIndex = activeQueue.findIndex((t) => t.id === currentTrackId);
    if (currentIndex < activeQueue.length - 1) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(false);
    audioEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleToggleRepeat = () => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleMakeOffline = async (track: Track) => {
    try {
      const response = await fetch(track.url);
      const blob = await response.blob();
      await storeAudioBlobOffline(track.id, blob);

      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isOffline: true } : t))
      );

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.warn('Could not cache track offline directly (CORS / network). Marking local tag.', err);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isOffline: true } : t))
      );
    }
  };

  const handleMakeAllOffline = async () => {
    setIsCachingAll(true);
    for (const track of tracks) {
      try {
        const response = await fetch(track.url);
        const blob = await response.blob();
        await storeAudioBlobOffline(track.id, blob);
      } catch {
        // Continue
      }
    }
    setTracks((prev) => prev.map((t) => ({ ...t, isOffline: true })));
    setIsCachingAll(false);

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.7 },
    });
  };

  const handleAddTracks = (newTracks: Track[]) => {
    setTracks((prev) => {
      const unique = newTracks.filter(
        (nt) => !prev.some((et) => et.title === nt.title && et.artist === nt.artist)
      );
      return [...prev, ...unique];
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const handleDeleteTrack = async (trackId: string) => {
    await removeAudioBlobOffline(trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setActiveQueue((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrackId === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) {
        loadAndPlayTrack(remaining[0], false);
      } else {
        setCurrentTrackId(null);
        setIsPlaying(false);
      }
    }
  };

  const handleCreatePlaylist = (name: string, trackIds: string[], color: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      trackIds,
      color,
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    setIsPlaylistModalOpen(false);
  };

  const handleUpdatePlaylist = (updated: Playlist) => {
    setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setIsPlaylistModalOpen(false);
    setEditingPlaylist(null);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylistId === id) {
      setActiveView('home');
      setSelectedPlaylistId(null);
    }
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const trackIds = pl.trackIds.includes(trackId)
            ? pl.trackIds
            : [...pl.trackIds, trackId];
          return { ...pl, trackIds };
        }
        return pl;
      })
    );
  };

  const handleRemoveFromPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) };
        }
        return pl;
      })
    );
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  };

  const handleSetTrendingEffect = (fx: TrendingAudioEffect) => {
    setActiveTrendingEffect(fx);
    audioEngine.applyTrendingEffect(fx);
    if (fx === 'sped_up') setPlaybackRate(1.25);
    else if (fx === 'slowed_reverb') setPlaybackRate(0.85);
    else if (fx === 'nightcore') setPlaybackRate(1.35);
    else if (fx === 'lofi_tape') setPlaybackRate(0.92);
    else setPlaybackRate(1.0);

    setAutoSyncToast(`Applied FX: ${fx.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setAutoSyncToast(null), 2500);
  };

  const handleToggleKaraoke = (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !isKaraokeMode;
    setIsKaraokeMode(nextState);
    audioEngine.toggleKaraokeMode(nextState);
    setAutoSyncToast(nextState ? '🎤 AI Karaoke Mode (Vocals Removed)' : 'Original Vocal Mix');
    setTimeout(() => setAutoSyncToast(null), 2500);
  };

  const handleUpdateLyrics = (trackId: string, newLyrics: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, lyrics: newLyrics } : t))
    );
  };

  const handleUpgradeToPro = (plan: 'lifetime' | 'yearly' | 'monthly') => {
    setIsProUser(true);
    localStorage.setItem('sonance_pro_active', 'true');
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
    });
    setAutoSyncToast('👑 Sonance PRO Lifetime Activated!');
    setTimeout(() => setAutoSyncToast(null), 4000);
  };

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimerRemaining(minutes * 60);
    setIsSleepTimerOpen(false);
  };

  const handleCancelSleepTimer = () => {
    setSleepTimerRemaining(null);
    setIsSleepTimerOpen(false);
  };

  const handleClearOfflineCache = async () => {
    for (const track of tracks) {
      await removeAudioBlobOffline(track.id);
    }
    setTracks((prev) => prev.map((t) => ({ ...t, isOffline: false })));
  };

  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Play whole track collection
  const handlePlayAll = (targetTracks: Track[], shuffle: boolean = false) => {
    if (targetTracks.length === 0) return;
    const finalQueue = shuffle ? [...targetTracks].sort(() => Math.random() - 0.5) : targetTracks;
    setActiveQueue(finalQueue);
    loadAndPlayTrack(finalQueue[0], true);
  };

  // Compute view title
  const getViewTitle = () => {
    switch (activeView) {
      case 'home':
        return 'Music Player';
      case 'library':
        return 'All Songs';
      case 'folder':
        return 'Folders';
      case 'favorite':
        return 'Favorite Tracks';
      case 'recent_play':
        return 'Recently Played';
      case 'recent_add':
        return 'Recently Added';
      case 'most_play':
        return 'Most Played';
      case 'playlist_detail':
        const pl = playlists.find((p) => p.id === selectedPlaylistId);
        return pl ? pl.name : 'Playlist';
      case 'drive_mode':
        return 'Drive Mode';
      default:
        return 'Sonance Music';
    }
  };

  // Compute active tracks for list view
  const currentViewTracks = useMemo(() => {
    switch (activeView) {
      case 'library':
        return tracks;
      case 'folder':
        return tracks;
      case 'favorite':
        return tracks.filter((t) => t.isFavorite);
      case 'recent_play':
        return [...tracks].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      case 'recent_add':
        return [...tracks].sort((a, b) => b.dateAdded - a.dateAdded);
      case 'most_play':
        return [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      case 'playlist_detail':
        const pl = playlists.find((p) => p.id === selectedPlaylistId);
        if (!pl) return [];
        return tracks.filter((t) => pl.trackIds.includes(t.id));
      default:
        return tracks;
    }
  }, [activeView, tracks, selectedPlaylistId, playlists]);

  return (
    <div
      id="sonance-app-root"
      className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans transition-colors duration-300"
    >
      {/* Drive Mode full screen replacement */}
      {activeView === 'drive_mode' ? (
        <DriveModeView
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          volume={volume}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
          onVolumeChange={handleVolumeChange}
          onExitDriveMode={() => setActiveView('home')}
        />
      ) : (
        <>
          {/* Main Sticky Header */}
          <Header
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenProModal={() => setIsProModalOpen(true)}
            onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeViewTitle={getViewTitle()}
            onBackToHome={() => {
              setActiveView('home');
              setSelectedPlaylistId(null);
            }}
            offlineCount={offlineCount}
            totalTracks={tracks.length}
            isProUser={isProUser}
          />

          {/* Main Dynamic View Content */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'home' ? (
              <HomeGrid
                tracks={tracks}
                playlists={playlists}
                onSelectView={(v, plId) => {
                  setActiveView(v);
                  if (plId) setSelectedPlaylistId(plId);
                }}
                onOpenCreatePlaylist={() => {
                  setEditingPlaylist(null);
                  setIsPlaylistModalOpen(true);
                }}
                onShuffleAll={() => handlePlayAll(tracks, true)}
                onPlayTrack={(track) => loadAndPlayTrack(track, true)}
                onOpenScanModal={() => setIsScanOpen(true)}
              />
            ) : (
              <TrackList
                view={activeView}
                title={getViewTitle()}
                tracks={currentViewTracks}
                allPlaylists={playlists}
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                onPlayTrack={(track) => loadAndPlayTrack(track, true)}
                onToggleFavorite={handleToggleFavorite}
                onMakeOffline={handleMakeOffline}
                onAddToPlaylist={handleAddToPlaylist}
                onDeleteTrack={handleDeleteTrack}
                onPlayAll={handlePlayAll}
                onOpenCreatePlaylist={() => {
                  setEditingPlaylist(null);
                  setIsPlaylistModalOpen(true);
                }}
                onOpenLyrics={(track) => {
                  setLyricsTrack(track);
                  setIsLyricsOpen(true);
                }}
                selectedPlaylist={
                  selectedPlaylistId
                    ? playlists.find((p) => p.id === selectedPlaylistId)
                    : undefined
                }
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
              />
            )}
          </main>

          {/* Bottom Mini Player */}
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={handleTogglePlay}
            onNextTrack={handleNextTrack}
            onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
            onOpenQueue={() => setIsQueueOpen(true)}
          />

          {/* Sidebar Drawer */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenEqualizer={() => setIsEqOpen(true)}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onOpenThemeModal={() => setIsThemeOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
            onOpenProModal={() => setIsProModalOpen(true)}
            onEnterDriveMode={() => setActiveView('drive_mode')}
            repeatMode={repeatMode}
            onToggleRepeat={handleToggleRepeat}
            currentTheme={theme}
            sleepTimerRemaining={sleepTimerRemaining}
            offlineCount={offlineCount}
            isProUser={isProUser}
          />

          {/* Full Screen Player Modal */}
          <FullPlayer
            isOpen={isFullPlayerOpen}
            onClose={() => setIsFullPlayerOpen(false)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            playbackRate={playbackRate}
            activeTrendingEffect={activeTrendingEffect}
            isKaraokeMode={isKaraokeMode}
            isProUser={isProUser}
            onTogglePlay={handleTogglePlay}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onToggleShuffle={handleToggleShuffle}
            onToggleRepeat={handleToggleRepeat}
            onToggleFavorite={handleToggleFavorite}
            onSetPlaybackRate={handleSetPlaybackRate}
            onSetTrendingEffect={handleSetTrendingEffect}
            onToggleKaraoke={() => handleToggleKaraoke()}
            onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
            onOpenProModal={() => setIsProModalOpen(true)}
            onOpenEqualizer={() => setIsEqOpen(true)}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onOpenLyrics={() => {
              setLyricsTrack(currentTrack);
              setIsLyricsOpen(true);
            }}
            onOpenQueue={() => setIsQueueOpen(true)}
          />

          {/* 10-Band Equalizer Modal */}
          <EqualizerModal
            isOpen={isEqOpen}
            onClose={() => setIsEqOpen(false)}
            settings={eqSettings}
            onChangeSettings={setEqSettings}
            isPlaying={isPlaying}
          />

          {/* Scan & Storage Modal */}
          <ScanLibraryModal
            isOpen={isScanOpen}
            onClose={() => setIsScanOpen(false)}
            onAddTracks={handleAddTracks}
            existingTracks={tracks}
            onMakeAllOffline={handleMakeAllOffline}
            isCachingAll={isCachingAll}
          />

          {/* Ringtone & Audio Cutter Modal */}
          <RingtoneTrimmerModal
            isOpen={isRingtoneOpen}
            onClose={() => setIsRingtoneOpen(false)}
            track={currentTrack}
          />

          {/* Monetization & Pro Upgrade Modal */}
          <MonetizationProModal
            isOpen={isProModalOpen}
            onClose={() => setIsProModalOpen(false)}
            isProUser={isProUser}
            onUpgradeToPro={handleUpgradeToPro}
          />

          {/* Playlist Creation / Edit Modal */}
          <PlaylistModal
            isOpen={isPlaylistModalOpen}
            onClose={() => {
              setIsPlaylistModalOpen(false);
              setEditingPlaylist(null);
            }}
            onCreatePlaylist={handleCreatePlaylist}
            onUpdatePlaylist={handleUpdatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            existingPlaylist={editingPlaylist}
            allTracks={tracks}
          />

          {/* Sleep Timer Modal */}
          <SleepTimerModal
            isOpen={isSleepTimerOpen}
            onClose={() => setIsSleepTimerOpen(false)}
            sleepTimerRemaining={sleepTimerRemaining}
            onSetTimer={handleSetSleepTimer}
            onCancelTimer={handleCancelSleepTimer}
          />

          {/* Lyrics & AI Karaoke Modal */}
          <LyricsModal
            isOpen={isLyricsOpen}
            onClose={() => setIsLyricsOpen(false)}
            track={lyricsTrack || currentTrack}
            currentTime={currentTime}
            isKaraokeMode={isKaraokeMode}
            onToggleKaraoke={handleToggleKaraoke}
            onUpdateLyrics={handleUpdateLyrics}
          />

          {/* Queue Modal */}
          <QueueModal
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            queue={activeQueue}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={(track) => loadAndPlayTrack(track, true)}
            onShuffleQueue={() => {
              const shuffled = [...activeQueue].sort(() => Math.random() - 0.5);
              setActiveQueue(shuffled);
            }}
          />

          {/* Themes Modal */}
          <ThemeModal
            isOpen={isThemeOpen}
            onClose={() => setIsThemeOpen(false)}
            currentTheme={theme}
            onSelectTheme={(t) => setTheme(t)}
          />

          {/* Auto-Sync Toast Notification */}
          {autoSyncToast && (
            <div
              id="auto-sync-toast"
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{autoSyncToast}</span>
            </div>
          )}

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            hiFiMode={hiFiMode}
            onToggleHiFi={() => setHiFiMode(!hiFiMode)}
            onClearOfflineCache={handleClearOfflineCache}
            onResetAllData={handleResetAllData}
            offlineCount={offlineCount}
          />
        </>
      )}
    </div>
  );
}
