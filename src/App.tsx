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
  loadTracksFromIDB,
  DEFAULT_EQ_SETTINGS,
  DEFAULT_PLAYER_SETTINGS,
  hasInitialScanCompleted,
  setInitialScanCompleted,
} from './services/storage';
import {
  restoreTrackBlobUrls,
  autoScanStoredDirectory,
  scanAudioFiles,
  checkForNewDownloads,
  convertNativeSongToTrack,
} from './services/deviceScanner';
import { audioEngine, TrendingAudioEffect } from './services/audioEngine';
import { getThemeConfig } from './data/themes';
import { Capacitor } from '@capacitor/core';
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
import { SetRingtoneConfirmModal } from './components/SetRingtoneConfirmModal';
import { AffiliateDealsModal } from './components/AffiliateDealsModal';
import { LibraryView } from './components/LibraryView';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { AffiliateProduct } from './types';
import { loadAffiliateProducts } from './data/affiliateProducts';
import { subscribeToCloudAffiliateProducts } from './services/affiliateService';
import { sortTracksAlphabetical } from './utils/trackSort';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

export default function App() {
  // --- Persistent State ---
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [tracks, setTracks] = useState<Track[]>(() => sortTracksAlphabetical(loadStoredTracks()));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadStoredPlaylists());
  const [theme, setTheme] = useState<AppTheme>(() => loadStoredTheme());
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() => loadStoredEq());
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => loadStoredPlayerSettings());
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>(() => loadAffiliateProducts());
  const [isAffiliateDealsOpen, setIsAffiliateDealsOpen] = useState(false);
  const [selectedAffiliateProduct, setSelectedAffiliateProduct] = useState<AffiliateProduct | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isProUser, setIsProUser] = useState<boolean>(true);

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
  const [ringtoneConfirmTrack, setRingtoneConfirmTrack] = useState<Track | null>(null);
  const [isDriveSafetyModalOpen, setIsDriveSafetyModalOpen] = useState(false);
  const [backToast, setBackToast] = useState<string | null>(null);

  const handleShowBackToast = (msg: string) => {
    setBackToast(msg);
    setTimeout(() => {
      setBackToast((curr) => (curr === msg ? null : curr));
    }, 2000);
  };

  // Android System Hardware Back Button & Gesture Handler
  useAndroidBackButton({
    showWelcome,
    setShowWelcome,
    ringtoneConfirmTrack,
    setRingtoneConfirmTrack,
    artworkModalTrack,
    setArtworkModalTrack,
    actionMenuTrack,
    setActionMenuTrack,
    isDriveSafetyModalOpen,
    setIsDriveSafetyModalOpen,
    isAffiliateDealsOpen,
    setIsAffiliateDealsOpen,
    isProModalOpen,
    setIsProModalOpen,
    isSleepTimerOpen,
    setIsSleepTimerOpen,
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    setEditingPlaylist,
    isThemeOpen,
    setIsThemeOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isScanOpen,
    setIsScanOpen,
    isWidgetOpen,
    setIsWidgetOpen,
    isHiddenFilesOpen,
    setIsHiddenFilesOpen,
    isRingtoneOpen,
    setIsRingtoneOpen,
    isKaraokeStudioOpen,
    setIsKaraokeStudioOpen,
    isBeatInstrumentalOpen,
    setIsBeatInstrumentalOpen,
    isWebBrowserOpen,
    setIsWebBrowserOpen,
    isEqOpen,
    setIsEqOpen,
    isLyricsOpen,
    setIsLyricsOpen,
    setLyricsTrack,
    isQueueOpen,
    setIsQueueOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    searchQuery,
    setSearchQuery,
    activeView,
    setActiveView,
    setSelectedPlaylistId,
    onShowToast: handleShowBackToast,
  });

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
  const [pausedNextPressCount, setPausedNextPressCount] = useState<number>(0);

  // Load tracks from IndexedDB asynchronously on mount to restore large libraries (thousands of downloads)
  useEffect(() => {
    loadTracksFromIDB().then((idbTracks) => {
      if (idbTracks && idbTracks.length > 0) {
        setTracks(sortTracksAlphabetical(idbTracks));
      }
    });
  }, []);

  // Real-time Cloud Feed subscription for Affiliate Billboard Products
  useEffect(() => {
    const unsubscribe = subscribeToCloudAffiliateProducts((cloudProducts, isConnected) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setAffiliateProducts(cloudProducts);
      }
      setIsCloudConnected(isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- Active Queue State ---
  const [activeQueue, setActiveQueue] = useState<Track[]>(() => tracks);

  // Keep activeQueue in sync when tracks load/update if activeQueue is empty or missing current track
  useEffect(() => {
    if (tracks.length > 0) {
      setActiveQueue((prev) => {
        if (prev.length === 0) return tracks;
        if (currentTrackId && !prev.some((t) => t.id === currentTrackId)) {
          if (tracks.some((t) => t.id === currentTrackId)) return tracks;
        }
        return prev;
      });
    }
  }, [tracks, currentTrackId]);

  // --- Sleep Timer State ---
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const handleNextTrackRef = useRef<(forcePlay?: boolean) => void>(() => {});
  const handlePrevTrackRef = useRef<() => void>(() => {});
  const handleTogglePlayRef = useRef<() => void>(() => {});
  const handleSeekRef = useRef<(sec: number) => void>(() => {});
  const handleToggleFavoriteRef = useRef<(id: string) => void>(() => {});
  const handleTrackEndRef = useRef<() => void>(() => {});
  const handleNativeAutoAdvancedRef = useRef<(trackId: string) => void>(() => {});

  // Derive Current Track
  const currentTrack = useMemo(() => {
    return tracks.find((t) => t.id === currentTrackId) || tracks[0] || null;
  }, [tracks, currentTrackId]);

  // Derive Offline count
  const offlineCount = useMemo(() => {
    return tracks.filter((t) => t.isOffline).length;
  }, [tracks]);

  // Check if currently inside Library Tracks or Folder view
  const isInsideLibraryOrFolder = activeView === 'library' || activeView === 'folder';

  // Strict User Mandate: Completely suppress and block all Ad pop-ups when inside Library / Folder
  useEffect(() => {
    if (isInsideLibraryOrFolder) {
      setIsAffiliateDealsOpen(false);
      setIsProModalOpen(false);
    }
  }, [isInsideLibraryOrFolder]);

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

  // Shake to play next song (Strictly active ONLY when settings.shakeToPlayNext is true)
  useEffect(() => {
    if (!playerSettings.shakeToPlayNext) {
      return;
    }

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 24; // Intentional shake acceleration threshold in m/s^2
    const COOLDOWN_MS = 1200; // Cooldown between shakes to prevent rapid unwanted triggers

    const handleMotion = (e: DeviceMotionEvent) => {
      // Guard against stale state
      if (!playerSettings.shakeToPlayNext) return;

      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      if (now - lastShakeTime < COOLDOWN_MS) return;

      if (lastX === null || lastY === null || lastZ === null) {
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
        return;
      }

      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);
      const totalDelta = deltaX + deltaY + deltaZ;

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;

      if (totalDelta > SHAKE_THRESHOLD) {
        lastShakeTime = now;
        handleNextTrackRef.current(true);
        setAutoSyncToast('📳 Shake detected: Next Track');
        setTimeout(() => setAutoSyncToast(null), 2000);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [playerSettings.shakeToPlayNext]);

  // Lock screen media session & media notification controller (Web & Android)
  useEffect(() => {
    if (!currentTrack) return;

    if (playerSettings.statusBarLyrics !== 'off' && isPlaying) {
      document.title = `▶ ${currentTrack.title} - ${currentTrack.artist}`;
    } else {
      document.title = 'Music Player';
    }

    // 1. Web MediaSession API (Lock screen widget on Android Chrome, PWA & browsers)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist:
            currentTrack.artist +
            (playerSettings.carBluetoothLyrics && currentTrack.lyrics
              ? ` | ${currentTrack.lyrics.slice(0, 50)}...`
              : ''),
          album: currentTrack.album || 'Sonance Music',
          artwork: [
            { src: currentTrack.coverArt, sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.coverArt, sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.coverArt, sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.coverArt, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.coverArt, sizes: '384x384', type: 'image/jpeg' },
            { src: currentTrack.coverArt, sizes: '512x512', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', () => {
          handleTogglePlayRef.current();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          handleTogglePlayRef.current();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevTrackRef.current();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextTrackRef.current(true);
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && !isNaN(details.seekTime)) {
            handleSeekRef.current(details.seekTime);
          }
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          handleSeekRef.current(Math.max(0, currentTime - (details.seekOffset || 10)));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          handleSeekRef.current(Math.min(duration, currentTime + (details.seekOffset || 10)));
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          audioEngine.pause();
          setIsPlaying(false);
          if (Capacitor.isNativePlatform()) {
            MusicLibrary.hideNotification().catch(() => {});
          }
        });
      } catch (err) {
        console.debug('MediaSession action handler error:', err);
      }
    }

    // 2. Native Android Foreground Service & MediaStyle Lock Screen Notification
    if (Capacitor.isNativePlatform()) {
      MusicLibrary.updateNotification({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        coverArt: currentTrack.coverArt,
        isPlaying,
        duration: duration > 0 ? duration * 1000 : (currentTrack.duration || 0) * 1000,
        currentTime: currentTime * 1000,
        isFavorite: currentTrack.isFavorite,
      }).catch((e) => console.debug('Failed to update native notification:', e));
    }
  }, [
    currentTrack,
    isPlaying,
    playerSettings.statusBarLyrics,
    playerSettings.carBluetoothLyrics,
  ]);

  // Sync timeline progress scrubber with system lock screen widget
  useEffect(() => {
    if (!currentTrack || duration <= 0 || isNaN(duration) || isNaN(currentTime)) return;

    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate || 1,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch {
        // ignore unsupported browser states
      }
    }
  }, [currentTime, duration, playbackRate, currentTrack]);

  // Listen for actions and auto-advancement from Android native notification & lock screen controls
  useEffect(() => {
    let mediaSub: any = null;
    let autoAdvSub: any = null;
    const registerNativeMediaActions = async () => {
      try {
        mediaSub = await MusicLibrary.addListener('mediaAction', (event) => {
          switch (event.type) {
            case 'play':
            case 'pause':
              if (!Capacitor.isNativePlatform()) {
                handleTogglePlayRef.current();
              }
              break;
            case 'next':
              if (!Capacitor.isNativePlatform()) {
                handleNextTrackRef.current(true);
              }
              break;
            case 'previous':
              if (!Capacitor.isNativePlatform()) {
                handlePrevTrackRef.current();
              }
              break;
            case 'seekTo':
              if (event.position !== undefined) {
                handleSeekRef.current(event.position / 1000);
              }
              break;
            case 'favorite':
              if (currentTrackId) {
                handleToggleFavoriteRef.current(currentTrackId);
              }
              break;
            case 'close':
              audioEngine.pause();
              setIsPlaying(false);
              MusicLibrary.hideNotification().catch(() => {});
              break;
          }
        });

        autoAdvSub = await MusicLibrary.addListener('trackAutoAdvanced', (event) => {
          if (event && event.id) {
            handleNativeAutoAdvancedRef.current(event.id);
          }
        });
      } catch (e) {
        console.debug('Native mediaAction listener registration:', e);
      }
    };
    registerNativeMediaActions();

    return () => {
      if (mediaSub && typeof mediaSub.remove === 'function') {
        mediaSub.remove();
      }
      if (autoAdvSub && typeof autoAdvSub.remove === 'function') {
        autoAdvSub.remove();
      }
    };
  }, [currentTrackId]);

  // 0-Scan Startup & Initial Permission Flow:
  // 1. If user previously completed initial scan, DO NOT re-scan! All music loads instantly from cache.
  // 2. On first install, when user grants audio permission, scan immediately within 1s and save all songs.
  // 3. Incrementally detect newly downloaded/added music without doing full re-scans.
  useEffect(() => {
    let isMounted = true;

    const initDeviceSync = async () => {
      try {
        // Restore cached audio blob URLs if any
        const restored = await restoreTrackBlobUrls(tracks);
        if (isMounted) {
          setTracks(restored);
        }

        const scanDone = hasInitialScanCompleted();

        // -------------------------------------------------------------
        // SCENARIO 1: Subsequent launches / app refreshes / return to app
        // Initial scan was already completed in a prior session.
        // DO NOT START SCANNING AGAIN! (Zero-delay, instant music load)
        // -------------------------------------------------------------
        if (scanDone) {
          // Perform a fast, silent background check only for newly added downloads
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              const newTracks = await checkForNewDownloads(tracksRef.current);
              if (newTracks.length > 0 && isMounted) {
                setTracks((prev) => {
                  const unique = newTracks.filter(
                    (nt) => !prev.some((et) => et.id === nt.id || (et.title === nt.title && et.artist === nt.artist))
                  );
                  if (unique.length === 0) return prev;
                  const updated = [...unique, ...prev];
                  saveStoredTracks(updated);
                  return updated;
                });
                setAutoSyncToast(
                  newTracks.length === 1
                    ? `⚡ Detected new download: "${newTracks[0].title}" added to Recently Added`
                    : `⚡ Detected ${newTracks.length} new downloads added to Recently Added`
                );
                setTimeout(() => setAutoSyncToast(null), 4000);
              }
            } catch (deltaErr) {
              console.debug('Silent delta check info:', deltaErr);
            }
          }, 800);

          return;
        }

        // -------------------------------------------------------------
        // SCENARIO 2: First-time install & launch (Initial Scan)
        // When notification/permission dialog appears:
        // "Allow Sonance Music to access audio files on this device"
        // When user taps "Allow", scan starts immediately within 1 second!
        // -------------------------------------------------------------
        if (Capacitor.isNativePlatform()) {
          try {
            // Request Android audio permission dialog
            const perm = await MusicLibrary.requestAudioPermission();

            // Also prompt notification permission for audio controls notification in background
            MusicLibrary.requestNotificationPermission().catch(() => {});

            if (perm && perm.granted) {
              // User pressed "Allow"! Start scanning immediately within a second
              if (isMounted) {
                setAutoSyncToast('🔍 Scanning your music collection...');
              }

              const scanResult = await MusicLibrary.scanSongs();
              if (scanResult && scanResult.songs && scanResult.songs.length > 0) {
                const nativeTracks: Track[] = scanResult.songs.map(convertNativeSongToTrack);
                const sortedNative = sortTracksAlphabetical(nativeTracks);

                if (isMounted) {
                  setTracks(sortedNative);
                  saveStoredTracks(sortedNative);
                  setInitialScanCompleted(true);
                  setAutoSyncToast(`🎉 Discovered & saved ${sortedNative.length} songs from your device!`);
                  setTimeout(() => setAutoSyncToast(null), 5000);
                }
                return;
              } else {
                // Initial scan finished, no media files found
                if (isMounted) {
                  setInitialScanCompleted(true);
                  setAutoSyncToast('Ready! No audio files found in device storage yet');
                  setTimeout(() => setAutoSyncToast(null), 3000);
                }
              }
            } else {
              console.warn('Audio permission was not granted by user');
            }
          } catch (nativeErr) {
            console.debug('Native initial permission & scan error:', nativeErr);
          }
        } else {
          // Web / desktop environment fallback
          const autoScanned = await autoScanStoredDirectory();
          if (autoScanned.length > 0) {
            const sortedAuto = sortTracksAlphabetical(autoScanned);
            if (isMounted) {
              setTracks(sortedAuto);
              saveStoredTracks(sortedAuto);
              setInitialScanCompleted(true);
              setAutoSyncToast(`Auto-synced ${autoScanned.length} phone songs`);
              setTimeout(() => setAutoSyncToast(null), 4000);
            }
          }
        }
      } catch (err) {
        console.debug('Device sync info:', err);
      }
    };

    initDeviceSync();

    return () => {
      isMounted = false;
    };
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

  // Keep tracks ref in sync for async auto-detection handlers
  const tracksRef = useRef<Track[]>(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const lastAutoScanTimeRef = useRef<number>(0);

  // Auto-detect newly downloaded music when switching back to Music Player from Chrome or online
  useEffect(() => {
    const handleCheckOnResume = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      // Debounce: minimum 6 seconds between background checks
      if (now - lastAutoScanTimeRef.current < 6000) return;
      lastAutoScanTimeRef.current = now;

      try {
        const newTracks = await checkForNewDownloads(tracksRef.current);
        if (newTracks.length > 0) {
          setTracks((prev) => {
            const unique = newTracks.filter(
              (nt) => !prev.some((et) => et.id === nt.id || (et.title === nt.title && et.artist === nt.artist))
            );
            if (unique.length === 0) return prev;
            const updated = [...unique, ...prev];
            saveStoredTracks(updated);
            return updated;
          });
          const songName = newTracks[0].title || 'track';
          const msg =
            newTracks.length === 1
              ? `⚡ Auto-detected new music: "${songName}" added to Recently Added!`
              : `⚡ Auto-detected ${newTracks.length} new tracks added to Recently Added!`;
          setAutoSyncToast(msg);
          setTimeout(() => setAutoSyncToast(null), 5000);
        }
      } catch (err) {
        console.debug('Resume auto-scan check:', err);
      }
    };

    document.addEventListener('visibilitychange', handleCheckOnResume);
    window.addEventListener('focus', handleCheckOnResume);

    // Periodic background check every 25 seconds while app is in foreground
    const interval = setInterval(handleCheckOnResume, 25000);

    return () => {
      document.removeEventListener('visibilitychange', handleCheckOnResume);
      window.removeEventListener('focus', handleCheckOnResume);
      clearInterval(interval);
    };
  }, []);

  // Chromium PWA LaunchQueue for "Open with Music Player" / downloaded file taps in Android Chrome
  useEffect(() => {
    if ('launchQueue' in window && (window as any).LaunchParams && 'files' in (window as any).LaunchParams.prototype) {
      try {
        (window as any).launchQueue.setConsumer(async (launchParams: any) => {
          if (launchParams.files && launchParams.files.length > 0) {
            const filePromises = launchParams.files.map((handle: any) => handle.getFile());
            const files: File[] = await Promise.all(filePromises);
            const audioFiles = files.filter(
              (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|opus|wma)$/i.test(f.name)
            );
            if (audioFiles.length > 0) {
              const newTracks = await scanAudioFiles(audioFiles);
              if (newTracks.length > 0) {
                setTracks((prev) => {
                  const unique = newTracks.filter(
                    (nt) => !prev.some((et) => et.title === nt.title && et.artist === nt.artist)
                  );
                  return unique.length > 0 ? [...unique, ...prev] : prev;
                });
                setAutoSyncToast(`Auto-opened ${newTracks.length} audio file(s)`);
                setTimeout(() => setAutoSyncToast(null), 4000);
                if (newTracks.length === 1) {
                  loadAndPlayTrack(newTracks[0], true);
                }
              }
            }
          }
        });
      } catch (err) {
        console.debug('LaunchQueue consumer setup error:', err);
      }
    }
  }, []);

  // --- Audio Engine Event Bindings (Unified Native & Web) ---
  useEffect(() => {
    audioEngine.init();
    audioEngine.applyEqualizer(eqSettings);
    audioEngine.setVolume(isMuted ? 0 : volume);
    audioEngine.setPlaybackRate(playbackRate);

    const unsubTime = audioEngine.onTimeUpdate((cur, dur) => {
      setCurrentTime(cur);
      if (dur && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
    });

    const unsubState = audioEngine.onStateChange((playing) => {
      setIsPlaying(playing);
    });

    const unsubEnded = audioEngine.onTrackEnd(() => {
      handleTrackEndRef.current();
    });

    const unsubAutoAdvanced = audioEngine.onTrackAutoAdvanced((evt) => {
      if (evt && evt.id) {
        handleNativeAutoAdvancedRef.current(evt.id);
      }
    });

    return () => {
      unsubTime();
      unsubState();
      unsubEnded();
      unsubAutoAdvanced();
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

  // Load and play track with robust queue context and native synchronization
  const loadAndPlayTrack = async (
    track: Track,
    autoPlay: boolean = true,
    newQueue?: Track[]
  ) => {
    const queueToUse =
      newQueue && newQueue.length > 0
        ? newQueue
        : activeQueue.length > 0 && activeQueue.some((t) => t.id === track.id)
        ? activeQueue
        : tracks.length > 0 && tracks.some((t) => t.id === track.id)
        ? tracks
        : [track];

    setActiveQueue(queueToUse);
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

    const currentIdx = queueToUse.findIndex((t) => t.id === track.id);
    const options = {
      queue: queueToUse,
      currentIndex: currentIdx >= 0 ? currentIdx : 0,
      repeatMode,
      isShuffle,
    };

    try {
      const cachedBlob = await getAudioBlobOffline(track.id);
      if (cachedBlob) {
        const localBlobUrl = URL.createObjectURL(cachedBlob);
        await audioEngine.loadTrack(localBlobUrl, track, options);
      } else {
        await audioEngine.loadTrack(track.url, track, options);
      }
    } catch {
      await audioEngine.loadTrack(track.url, track, options);
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
      setPausedNextPressCount(0);
    } else {
      await audioEngine.play(playerSettings.playPauseFade);
      setIsPlaying(true);
      setPausedNextPressCount(0);
    }
  };
  handleTogglePlayRef.current = handleTogglePlay;

  // Next Track: Strictly sequential ordering in current queue unless Shuffle is explicitly on
  const handleNextTrack = (forcePlay: boolean = false) => {
    const effectiveQueue =
      activeQueue.length > 0 && activeQueue.some((t) => t.id === currentTrackId)
        ? activeQueue
        : tracks.length > 0
        ? tracks
        : activeQueue;

    if (effectiveQueue.length === 0) return;
    const currentIndex = effectiveQueue.findIndex((t) => t.id === currentTrackId);
    let nextIndex = 0;

    if (isShuffle) {
      if (effectiveQueue.length > 1) {
        let rand = Math.floor(Math.random() * (effectiveQueue.length - 1));
        if (currentIndex !== -1 && rand >= currentIndex) {
          rand += 1;
        }
        nextIndex = rand;
      } else {
        nextIndex = 0;
      }
    } else {
      // Guaranteed strictly sequential: consecutive next track
      if (currentIndex === -1) {
        nextIndex = 0;
      } else {
        nextIndex = (currentIndex + 1) % effectiveQueue.length;
      }
    }

    const nextTrack = effectiveQueue[nextIndex];
    if (!nextTrack) return;

    // When paused and not forcing play:
    // First tap on next cues track without playing; pressing another next starts playback
    if (!isPlaying && !forcePlay) {
      if (pausedNextPressCount === 0) {
        setPausedNextPressCount(1);
        loadAndPlayTrack(nextTrack, false, effectiveQueue);
      } else {
        setPausedNextPressCount(0);
        loadAndPlayTrack(nextTrack, true, effectiveQueue);
      }
    } else {
      setPausedNextPressCount(0);
      loadAndPlayTrack(nextTrack, true, effectiveQueue);
    }
  };
  handleNextTrackRef.current = handleNextTrack;

  const handlePrevTrack = () => {
    const effectiveQueue =
      activeQueue.length > 0 && activeQueue.some((t) => t.id === currentTrackId)
        ? activeQueue
        : tracks.length > 0
        ? tracks
        : activeQueue;

    if (effectiveQueue.length === 0) return;
    const currentIndex = effectiveQueue.findIndex((t) => t.id === currentTrackId);
    let prevIndex = 0;
    if (currentIndex <= 0) {
      prevIndex = effectiveQueue.length - 1;
    } else {
      prevIndex = currentIndex - 1;
    }

    const prevTrack = effectiveQueue[prevIndex];
    if (!prevTrack) return;

    // When paused, navigating back cues track without playing
    if (!isPlaying) {
      setPausedNextPressCount(0);
      loadAndPlayTrack(prevTrack, false, effectiveQueue);
    } else {
      loadAndPlayTrack(prevTrack, true, effectiveQueue);
    }
  };
  handlePrevTrackRef.current = handlePrevTrack;

  // Track end callback: seamless auto-advance or repeat
  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }

    const effectiveQueue =
      activeQueue.length > 0 && activeQueue.some((t) => t.id === currentTrackId)
        ? activeQueue
        : tracks.length > 0
        ? tracks
        : activeQueue;

    if (effectiveQueue.length === 0) return;

    if (repeatMode === 'all') {
      handleNextTrack(true);
      return;
    }

    // Repeat off: stop gracefully at the end of the user's library/queue
    const currentIndex = effectiveQueue.findIndex((t) => t.id === currentTrackId);
    if (currentIndex !== -1 && currentIndex < effectiveQueue.length - 1) {
      handleNextTrack(true);
    } else {
      setIsPlaying(false);
      if (Capacitor.isNativePlatform()) {
        MusicLibrary.updateNotification({
          title: currentTrack?.title || 'Sonance Music',
          artist: currentTrack?.artist || '',
          album: currentTrack?.album,
          coverArt: currentTrack?.coverArt,
          isPlaying: false,
          duration: (duration || 0) * 1000,
          currentTime: (currentTime || 0) * 1000,
          isFavorite: currentTrack?.isFavorite,
        }).catch(() => {});
      }
    }
  };
  handleTrackEndRef.current = handleTrackEnd;

  // Native auto-advance handler from background Android service
  const handleNativeAutoAdvanced = (trackId: string) => {
    const foundTrack =
      tracks.find((t) => t.id === trackId || t.id === `native-${trackId}` || t.id.includes(trackId)) ||
      activeQueue.find((t) => t.id === trackId || t.id === `native-${trackId}` || t.id.includes(trackId));

    if (foundTrack) {
      setCurrentTrackId(foundTrack.id);
      setIsPlaying(true);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === foundTrack.id
            ? { ...t, playCount: (t.playCount || 0) + 1, lastPlayed: Date.now() }
            : t
        )
      );
    }
  };
  handleNativeAutoAdvancedRef.current = handleNativeAutoAdvanced;

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };
  handleSeekRef.current = handleSeek;

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
    setIsShuffle((prev) => {
      const next = !prev;
      audioEngine.syncPlaybackMode(repeatMode, next);
      return next;
    });
  };

  const handleToggleRepeat = () => {
    setRepeatMode((prev) => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      audioEngine.syncPlaybackMode(next, isShuffle);
      return next;
    });
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };
  handleToggleFavoriteRef.current = handleToggleFavorite;

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
      // Exclude demo/built-in tracks if real owner tracks are added
      const ownerPrev = prev.filter((t) => t.sourceType !== 'built-in');
      const unique = newTracks.filter(
        (nt) => !ownerPrev.some((et) => et.title.toLowerCase() === nt.title.toLowerCase() && et.artist.toLowerCase() === nt.artist.toLowerCase())
      );
      const combined = unique.length > 0 ? [...ownerPrev, ...unique] : (ownerPrev.length > 0 ? ownerPrev : newTracks);
      const sorted = sortTracksAlphabetical(combined);
      saveStoredTracks(sorted);
      return sorted;
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
    loadAndPlayTrack(finalQueue[0], true, finalQueue);
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
          {/* Main Sticky Header (Hidden when inside Library or Folder view, as LibraryView renders its own dedicated header matching the screenshot) */}
          {!isInsideLibraryOrFolder && (
            <Header
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onOpenScanModal={() => setIsScanOpen(true)}
              onOpenProModal={() => setIsProModalOpen(true)}
              onOpenRingtoneTrimmer={() => setIsRingtoneOpen(true)}
              onOpenAffiliateDealsModal={() => setIsAffiliateDealsOpen(true)}
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
          )}

          {/* Main Dynamic View Content */}
          <main id="app-main-content" className="flex-1 overflow-y-auto">
            {isInsideLibraryOrFolder ? (
              <LibraryView
                tracks={tracks}
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                initialTab={activeView === 'folder' ? 'folders' : 'tracks'}
                onBackToHome={() => {
                  setActiveView('home');
                  setSelectedPlaylistId(null);
                }}
                onPlayTrack={(track, queue) => loadAndPlayTrack(track, true, queue)}
                onPlayAll={handlePlayAll}
                onOpenTrackActions={(track) => setActionMenuTrack(track)}
                onOpenEqualizer={() => setIsEqOpen(true)}
                onOpenScanModal={() => setIsScanOpen(true)}
                onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
                onOpenThemeModal={() => setIsThemeOpen(true)}
                currentTheme={theme}
              />
            ) : activeView === 'home' ? (
              <HomeGrid
                tracks={tracks}
                playlists={playlists}
                showShuffleButton={playerSettings.showShuffleButton}
                accentColorHex={ACCENT_COLOR_MAP[playerSettings.accentColor]?.hex || '#f5b731'}
                currentTheme={theme}
                affiliateProducts={affiliateProducts}
                onOpenAffiliateDealsModal={() => setIsAffiliateDealsOpen(true)}
                onSelectAffiliateProduct={(prod) => setSelectedAffiliateProduct(prod)}
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
                onOpenEqualizer={() => setIsEqOpen(true)}
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
                onPlayTrack={(track, queue) => loadAndPlayTrack(track, true, queue || currentViewTracks)}
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
                {(() => {
                  if (!currentTrack.lyrics) return `♪ ${currentTrack.title} - ${currentTrack.artist} ♪`;
                  const lines = currentTrack.lyrics.split('\n');
                  let text = '';
                  for (const line of lines) {
                    const match = line.match(/\[(\d{2}):(\d{2})(\.\d{2})?\](.*)/);
                    if (match) {
                      const min = parseInt(match[1], 10);
                      const sec = parseInt(match[2], 10);
                      if (currentTime >= min * 60 + sec) {
                        text = match[4].trim();
                      }
                    }
                  }
                  return text || lines[0].replace(/\[.*?\]/, '').trim() || `♪ ${currentTrack.title} ♪`;
                })()}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">
                CAPTION
              </span>
            </div>
          )}

          {/* Bottom Mini Player */}
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            currentTheme={theme}
            isLibraryMode={isInsideLibraryOrFolder}
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
            affiliateProducts={affiliateProducts}
            onOpenAffiliateDealsModal={() => setIsAffiliateDealsOpen(true)}
            onSelectAffiliateProduct={(prod) => {
              setSelectedAffiliateProduct(prod);
              setIsAffiliateDealsOpen(true);
            }}
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
            onAddTrackToLibrary={(newTrack) => handleAddTracks([newTrack])}
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
            onAddTrackToLibrary={(newTrack) => handleAddTracks([newTrack])}
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

          {/* Monetization & Pro Upgrade Modal - Disabled for v1.0 Launch */}
          {false && (
            <MonetizationProModal
              isOpen={isProModalOpen}
              onClose={() => setIsProModalOpen(false)}
              isProUser={isProUser}
              onUpgradeToPro={handleUpgradeToPro}
            />
          )}

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
            onSeek={handleSeek}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
          />

          {/* Queue Modal */}
          <QueueModal
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            queue={activeQueue}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={(track) => loadAndPlayTrack(track, true, activeQueue)}
            onShuffleQueue={() => {
              const shuffled = [...activeQueue].sort(() => Math.random() - 0.5);
              setActiveQueue(shuffled);
              audioEngine.syncQueue(shuffled, currentTrackId || undefined, repeatMode, isShuffle);
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

          {/* Android Back Button Double-Tap Exit Toast */}
          {backToast && (
            <div
              id="toast-back-exit"
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/95 border border-zinc-700/90 text-zinc-100 text-xs font-medium shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              <span>{backToast}</span>
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
            currentTheme={theme}
            onOpenThemeModal={() => {
              setIsThemeOpen(true);
            }}
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
              setRingtoneConfirmTrack(track);
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

          {/* Set As Ringtone Direct Confirmation Dialog */}
          <SetRingtoneConfirmModal
            isOpen={!!ringtoneConfirmTrack}
            onClose={() => setRingtoneConfirmTrack(null)}
            track={ringtoneConfirmTrack}
            onOpenTrimmer={(track) => {
              setCurrentTrackId(track.id);
              setIsRingtoneOpen(true);
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

          {/* Affiliate Music Gear Billboard & Store Modal - Strictly suppressed in Library / Folder view */}
          <AffiliateDealsModal
            isOpen={isAffiliateDealsOpen && !isInsideLibraryOrFolder}
            onClose={() => setIsAffiliateDealsOpen(false)}
            products={affiliateProducts}
            onUpdateProducts={(updated) => setAffiliateProducts(updated)}
            selectedProduct={selectedAffiliateProduct}
            isCloudConnected={isCloudConnected}
          />
        </>
      )}

      {/* Opening Welcome Screen showing Logo and "Welcome" text */}
      {showWelcome && (
        <WelcomeSplashScreen onDismiss={() => setShowWelcome(false)} />
      )}
    </div>
  );
}
