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
  PlayerSettings,
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
  loadStoredPlayerSettings,
  saveStoredPlayerSettings,
  storeAudioBlobOffline,
  getAudioBlobOffline,
  removeAudioBlobOffline,
  DEFAULT_EQ_SETTINGS,
  DEFAULT_PLAYER_SETTINGS,
} from './services/storage';
import {
  restoreTrackBlobUrls,
  autoScanStoredDirectory,
  scanAudioFiles,
} from './services/deviceScanner';
import { audioEngine, TrendingAudioEffect } from './services/audioEngine';
import { getThemeConfig } from './data/themes';
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
import { SettingsModal, ACCENT_COLOR_MAP } from './components/SettingsModal';
import { RingtoneTrimmerModal } from './components/RingtoneTrimmerModal';
import { KaraokeStudioModal } from './components/KaraokeStudioModal';
import { BeatInstrumentalModal } from './components/BeatInstrumentalModal';
import { MonetizationProModal } from './components/MonetizationProModal';
import { WebBrowserModal } from './components/WebBrowserModal';
import { WidgetModal } from './components/WidgetModal';
import { HiddenFilesModal } from './components/HiddenFilesModal';
import { TrackActionMenuModal } from './components/TrackActionMenuModal';
import { ArtworkUploadModal } from './components/ArtworkUploadModal';
import { DriveSafetyModal } from './components/DriveSafetyModal';
import { AdBanner } from './components/AdBanner';

export default function App() {
  // --- Persistent State ---
  const [tracks, setTracks] = useState<Track[]>(() => loadStoredTracks());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadStoredPlaylists());
  const [theme, setTheme] = useState<AppTheme>(() => loadStoredTheme());
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() => loadStoredEq());
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => loadStoredPlayerSettings());
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
  const [isKaraokeStudioOpen, setIsKaraokeStudioOpen] = useState(false);
  const [isBeatInstrumentalOpen, setIsBeatInstrumentalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isWebBrowserOpen, setIsWebBrowserOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isHiddenFilesOpen, setIsHiddenFilesOpen] = useState(false);
  const [isCachingAll, setIsCachingAll] = useState(false);
  const [autoSyncToast, setAutoSyncToast] = useState<string | null>(null);
  const [actionMenuTrack, setActionMenuTrack] = useState<Track | null>(null);
  const [artworkModalTrack, setArtworkModalTrack] = useState<Track | null>(null);
  const [isDriveSafetyModalOpen, setIsDriveSafetyModalOpen] = useState(false);

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
    saveStoredPlayerSettings(playerSettings);
  }, [playerSettings]);

  useEffect(() => {
    saveStoredEq(eqSettings);
    audioEngine.applyEqualizer(eqSettings);
  }, [eqSettings]);

  // Update Settings handler
  const handleUpdateSettings = (partial: Partial<PlayerSettings>) => {
    setPlayerSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveStoredPlayerSettings(updated);
      return updated;
    });
  };

  // Remove Duplicates handler
  const handleRemoveDuplicateTracks = (duplicateIds: string[]) => {
    setTracks((prev) => prev.filter((t) => !duplicateIds.includes(t.id)));
    setActiveQueue((prev) => prev.filter((t) => !duplicateIds.includes(t.id)));
    setAutoSyncToast(`Removed ${duplicateIds.length} duplicate songs`);
    setTimeout(() => setAutoSyncToast(null), 3000);
  };

  // Keep screen awake (WakeLock API) when enabled
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      if (playerSettings.keepScreenOn && 'wakeLock' in navigator) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch (e) {
          console.debug('Wake lock request not granted', e);
        }
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [playerSettings.keepScreenOn]);

  // Shake to play next song
  useEffect(() => {
    if (!playerSettings.shakeToPlayNext) return;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastTime = 0;
    const threshold = 18;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const now = Date.now();
      if (now - lastTime > 350) {
        const diffTime = now - lastTime;
        lastTime = now;
        const speed =
          (Math.abs((acc.x || 0) + (acc.y || 0) + (acc.z || 0) - lastX - lastY - lastZ) / diffTime) *
          10000;
        if (speed > threshold) {
          handleNextTrack();
          setAutoSyncToast('📳 Shake detected: Next Track');
          setTimeout(() => setAutoSyncToast(null), 2000);
        }
        lastX = acc.x || 0;
        lastY = acc.y || 0;
        lastZ = acc.z || 0;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [playerSettings.shakeToPlayNext, activeQueue, currentTrackId]);

  // Car bluetooth / status bar lyrics sync
  useEffect(() => {
    if (!currentTrack) return;
    if (playerSettings.statusBarLyrics !== 'off' && isPlaying) {
      document.title = `▶ ${currentTrack.title} - ${currentTrack.artist}`;
    } else {
      document.title = 'Music Player';
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist:
          currentTrack.artist +
          (playerSettings.carBluetoothLyrics && currentTrack.lyrics
            ? ` | ${currentTrack.lyrics.slice(0, 50)}...`
            : ''),
        album: currentTrack.album,
        artwork: [{ src: currentTrack.coverArt, sizes: '512x512', type: 'image/jpeg' }],
      });
    }
  }, [currentTrack, isPlaying, playerSettings.statusBarLyrics, playerSettings.carBluetoothLyrics]);

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
        await audioEngine.play(playerSettings.playPauseFade);
        setIsPlaying(true);
      } catch (err) {
        console.warn('Play error:', err);
      }
    }
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) return;

    if (isPlaying) {
      audioEngine.pause(playerSettings.playPauseFade);
      setIsPlaying(false);
    } else {
      await audioEngine.play(playerSettings.playPauseFade);
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

  const handlePlayNext = (track: Track) => {
    setActiveQueue((prev) => {
      const idx = prev.findIndex((t) => t.id === currentTrackId);
      const filtered = prev.filter((t) => t.id !== track.id);
      if (idx === -1) {
        return [track, ...filtered];
      }
      const newQueue = [...filtered];
      const newIdx = newQueue.findIndex((t) => t.id === currentTrackId);
      newQueue.splice(newIdx + 1, 0, track);
      return newQueue;
    });
    setAutoSyncToast(`Playing next: "${track.title}"`);
    setTimeout(() => setAutoSyncToast(null), 3000);
  };

  const handleEnqueue = (track: Track) => {
    setActiveQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) {
        return [...prev.filter((t) => t.id !== track.id), track];
      }
      return [...prev, track];
    });
    setAutoSyncToast(`Added to queue: "${track.title}"`);
    setTimeout(() => setAutoSyncToast(null), 3000);
  };

  const handleUpdateTrackArtwork = (trackId: string, artworkUrl: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, coverArt: artworkUrl } : t))
    );
    setActiveQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, coverArt: artworkUrl } : t))
    );

    // Update MediaSession if active
    if (currentTrackId === trackId && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack?.title || '',
        artist: currentTrack?.artist || '',
        album: currentTrack?.album || '',
        artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }],
      });
    }

    setAutoSyncToast('Cover artwork updated successfully!');
    setTimeout(() => setAutoSyncToast(null), 3000);
  };

  const handleShareTrack = async (track: Track) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Check out "${track.title}" by ${track.artist} on Sonance Music Player!`,
          url: window.location.href,
        });
      } catch {
        // user canceled
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `Now playing: "${track.title}" by ${track.artist}`
        );
        setAutoSyncToast(`Copied track info to clipboard!`);
        setTimeout(() => setAutoSyncToast(null), 3000);
      } catch {
        setAutoSyncToast(`Sharing: "${track.title}"`);
        setTimeout(() => setAutoSyncToast(null), 3000);
      }
    }
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

  const activeThemeConfig = getThemeConfig(theme);

  return (
    <div
      id="sonance-app-root"
      style={{
        backgroundColor: activeThemeConfig.bgCanvas,
        color: activeThemeConfig.textPrimary,
      }}
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
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
            currentTheme={theme}
          />

          {/* Main Dynamic View Content */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'home' ? (
              <HomeGrid
                tracks={tracks}
                playlists={playlists}
                showShuffleButton={playerSettings.showShuffleButton}
                accentColorHex={ACCENT_COLOR_MAP[playerSettings.accentColor]?.hex || '#f5b731'}
                currentTheme={theme}
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
                isProUser={isProUser}
                onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
                onOpenKaraokeStudio={() => setIsKaraokeStudioOpen(true)}
                onOpenBeatInstrumental={() => setIsBeatInstrumentalOpen(true)}
                onOpenProModal={() => setIsProModalOpen(true)}
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
                onOpenTrackActions={(track) => setActionMenuTrack(track)}
                onOpenArtwork={(track) => setArtworkModalTrack(track)}
                selectedPlaylist={
                  selectedPlaylistId
                    ? playlists.find((p) => p.id === selectedPlaylistId)
                    : undefined
                }
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
              />
            )}
          </main>

          {/* Floating Desktop Lyrics Overlay (when desktopLyrics is active & playing) */}
          {playerSettings.desktopLyrics && isPlaying && currentTrack && (
            <div
              id="desktop-lyrics-float"
              onClick={() => {
                setLyricsTrack(currentTrack);
                setIsLyricsOpen(true);
              }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-sm sm:max-w-md w-[90%] px-4 py-2 rounded-full bg-black/85 border border-zinc-700 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 text-center text-xs font-semibold text-white animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-pointer hover:bg-black/95 transition-all"
            >
              <div
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: ACCENT_COLOR_MAP[playerSettings.accentColor]?.hex || '#f5b731' }}
              />
              <span className="truncate flex-1">
                {currentTrack.lyrics
                  ? currentTrack.lyrics.split('\n')[0]
                  : `♪ ${currentTrack.title} - ${currentTrack.artist} ♪`}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">
                LYRICS
              </span>
            </div>
          )}

          {/* Ad Banner (Completely removed for Sonance Pro users) */}
          <AdBanner
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
            position="bottom"
          />

          {/* Bottom Mini Player */}
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            currentTheme={theme}
            onTogglePlay={handleTogglePlay}
            onNextTrack={handleNextTrack}
            onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
            onOpenQueue={() => setIsQueueOpen(true)}
          />

          {/* Sidebar Drawer */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            playlists={playlists}
            onSelectPlaylist={(plId) => {
              setActiveView('playlist_detail');
              setSelectedPlaylistId(plId);
            }}
            onOpenCreatePlaylist={() => {
              setEditingPlaylist(null);
              setIsPlaylistModalOpen(true);
            }}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenEqualizer={() => setIsEqOpen(true)}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onOpenThemeModal={() => setIsThemeOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
            onOpenProModal={() => setIsProModalOpen(true)}
            onEnterDriveMode={() => {
              setIsDriveSafetyModalOpen(true);
            }}
            onOpenWebBrowser={() => setIsWebBrowserOpen(true)}
            onOpenWidgetModal={() => setIsWidgetOpen(true)}
            onOpenHiddenFilesModal={() => setIsHiddenFilesOpen(true)}
            onQuitApp={() => {
              if (window.confirm('Are you sure you want to exit Music Player?')) {
                audioEngine.pause();
                setIsPlaying(false);
                setIsSidebarOpen(false);
              }
            }}
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
            forwardAndBackward={playerSettings.forwardAndBackward}
            swipeToChangeSongs={playerSettings.swipeToChangeSongs}
            accentColorHex={ACCENT_COLOR_MAP[playerSettings.accentColor]?.hex || '#f5b731'}
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
            onOpenArtwork={(track) => setArtworkModalTrack(track)}
            onOpenTrackActions={(track) => setActionMenuTrack(track)}
          />

          {/* 10-Band Equalizer Modal */}
          <EqualizerModal
            isOpen={isEqOpen}
            onClose={() => setIsEqOpen(false)}
            settings={eqSettings}
            onChangeSettings={setEqSettings}
            isPlaying={isPlaying}
            use10Bands={playerSettings.use10BandsEqualizer}
            accentColorHex={ACCENT_COLOR_MAP[playerSettings.accentColor]?.hex || '#f5b731'}
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
            onToggle10Bands={(enable10) => {
              handleUpdateSettings({ ...playerSettings, use10BandsEqualizer: enable10 });
            }}
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

          {/* Ringtone & Audio Cutter / Batch ID3 Tag Editor Modal */}
          <RingtoneTrimmerModal
            isOpen={isRingtoneOpen}
            onClose={() => setIsRingtoneOpen(false)}
            track={currentTrack}
            tracks={tracks}
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
            onUpdateTracks={(updated) => setTracks(updated)}
          />

          {/* AI Karaoke Studio Modal */}
          <KaraokeStudioModal
            isOpen={isKaraokeStudioOpen}
            onClose={() => setIsKaraokeStudioOpen(false)}
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            isKaraokeMode={isKaraokeMode}
            onToggleKaraoke={handleToggleKaraoke}
            onPlayTrack={(track) => loadAndPlayTrack(track, true)}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            currentTheme={theme}
          />

          {/* Beat Instrumental AI Stems (Paid Plan) Modal */}
          <BeatInstrumentalModal
            isOpen={isBeatInstrumentalOpen}
            onClose={() => setIsBeatInstrumentalOpen(false)}
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
            onPlayTrack={(track) => loadAndPlayTrack(track, true)}
            onTogglePlay={handleTogglePlay}
            onAddTrackToLibrary={(newTrack) => handleAddTracks([newTrack])}
            currentTheme={theme}
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
            settings={playerSettings}
            onUpdateSettings={handleUpdateSettings}
            tracks={tracks}
            onRemoveDuplicateTracks={handleRemoveDuplicateTracks}
            onClearOfflineCache={handleClearOfflineCache}
            onResetAllData={handleResetAllData}
            offlineCount={offlineCount}
          />

          {/* Web Browser & Streaming Modal */}
          <WebBrowserModal
            isOpen={isWebBrowserOpen}
            onClose={() => setIsWebBrowserOpen(false)}
            onPlayStreamUrl={(streamTrack) => {
              setTracks((prev) => [streamTrack, ...prev.filter((t) => t.id !== streamTrack.id)]);
              loadAndPlayTrack(streamTrack, true);
            }}
          />

          {/* Home Screen Widget & Lock Screen Player Modal */}
          <WidgetModal
            isOpen={isWidgetOpen}
            onClose={() => setIsWidgetOpen(false)}
            currentTrack={currentTrack}
          />

          {/* Hidden Files & .nomedia Scanner Modal */}
          <HiddenFilesModal
            isOpen={isHiddenFilesOpen}
            onClose={() => setIsHiddenFilesOpen(false)}
            tracks={tracks}
            onAddTracks={handleAddTracks}
          />

          {/* 8-Option Action Menu Modal (Play next, Add to, Enqueue, Ringtone, Trim, Artwork, Share, Delete) */}
          <TrackActionMenuModal
            isOpen={!!actionMenuTrack}
            onClose={() => setActionMenuTrack(null)}
            track={actionMenuTrack}
            playlists={playlists}
            currentTheme={theme}
            onPlayNext={handlePlayNext}
            onEnqueue={handleEnqueue}
            onAddToPlaylist={handleAddToPlaylist}
            onCreatePlaylistWithTrack={(trackId) => {
              setEditingPlaylist(null);
              setIsPlaylistModalOpen(true);
            }}
            onOpenRingtone={(track) => {
              setCurrentTrackId(track.id);
              setIsRingtoneOpen(true);
            }}
            onOpenTrim={(track) => {
              setCurrentTrackId(track.id);
              setIsRingtoneOpen(true);
            }}
            onOpenArtwork={(track) => {
              setArtworkModalTrack(track);
            }}
            onShare={handleShareTrack}
            onDelete={(track) => {
              handleDeleteTrack(track.id);
            }}
          />

          {/* Artwork Upload & Camera Capture Modal */}
          <ArtworkUploadModal
            isOpen={!!artworkModalTrack}
            onClose={() => setArtworkModalTrack(null)}
            track={artworkModalTrack}
            onSaveArtwork={handleUpdateTrackArtwork}
          />

          {/* Road Safety & Traffic Instruction Modal for Drive Mode */}
          <DriveSafetyModal
            isOpen={isDriveSafetyModalOpen}
            onClose={() => setIsDriveSafetyModalOpen(false)}
            onConfirmEnterDriveMode={() => {
              setActiveView('drive_mode');
              setIsSidebarOpen(false);
              setIsFullPlayerOpen(false);
            }}
            currentTheme={theme}
          />
        </>
      )}
    </div>
  );
}
