import { get, set, del } from 'idb-keyval';
import { Track, Playlist, EqualizerSettings, AppTheme, PlayerSettings } from '../types';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, EQ_PRESET_MAP } from '../data/defaultTracks';

const STORAGE_KEYS = {
  TRACKS_METADATA: 'music_player_tracks_meta',
  PLAYLISTS: 'music_player_playlists',
  EQ_SETTINGS: 'music_player_eq',
  THEME: 'music_player_theme',
  PLAYER_SETTINGS: 'music_player_settings_v1',
  VOLUME: 'music_player_volume',
  LAST_TRACK: 'music_player_last_track',
  RECENT_PLAYED: 'music_player_recent_played',
  OFFLINE_BLOB_PREFIX: 'offline_track_blob_',
};

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  use10BandsEqualizer: true,
  showHiddenFiles: true,
  showDirectories: false,
  nightMode: true,
  keepScreenOn: false,
  showYouTubeSearchEntry: true,
  forwardAndBackward: false,
  queueAfterSearching: 'play_now',
  showShuffleButton: 'floating_fab',
  accentColor: 'gold',
  libraryTabOrder: ['all', 'folder', 'album', 'artist', 'genre', 'favorite'],
  desktopLyrics: false,
  carBluetoothLyrics: true,
  statusBarLyrics: 'off',
  shakeToPlayNext: false,
  swipeToChangeSongs: true,
  allowOthersPlaying: false,
  playPauseFade: false,
  gaplessPlayback: false,
};

export const loadStoredPlayerSettings = (): PlayerSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);
    if (!raw) return DEFAULT_PLAYER_SETTINGS;
    return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLAYER_SETTINGS;
  }
};

export const saveStoredPlayerSettings = (settings: PlayerSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save player settings', err);
  }
};

export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: 'Hi-Fi Master',
  bands: { ...EQ_PRESET_MAP['Hi-Fi Master'] },
  bassBoost: 20,
  spatialReverb: 0,
  trebleBoost: 15,
};

export const loadStoredTracks = (): Track[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKS_METADATA);
    if (!raw) return INITIAL_TRACKS;
    const parsed: Track[] = JSON.parse(raw);
    if (!parsed || parsed.length === 0) return INITIAL_TRACKS;

    // Migrate any legacy broken URLs (e.g. 403 Pixabay links) to valid, working streams
    let hasMigrated = false;
    const sanitized = parsed.map((track) => {
      if (track.url && (track.url.includes('pixabay.com') || track.url.includes('403'))) {
        hasMigrated = true;
        const fallback = INITIAL_TRACKS.find((t) => t.id === track.id);
        if (fallback) {
          return { ...track, url: fallback.url, duration: fallback.duration };
        }
      }
      return track;
    });

    if (hasMigrated) {
      saveStoredTracks(sanitized);
    }
    return sanitized;
  } catch {
    return INITIAL_TRACKS;
  }
};

const TRACKS_IDB_KEY = 'music_player_tracks_idb_v2';

/**
 * Loads the complete tracks collection from IndexedDB (handles thousands of tracks/downloads safely)
 */
export const loadTracksFromIDB = async (): Promise<Track[] | null> => {
  try {
    const idbTracks = await get(TRACKS_IDB_KEY);
    if (Array.isArray(idbTracks) && idbTracks.length > 0) {
      return idbTracks;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load tracks from IndexedDB:', err);
    return null;
  }
};

/**
 * Saves tracks safely to IndexedDB (virtually unlimited capacity) with guarded localStorage fallback
 * Prevents QuotaExceededError and app crashes when thousands of tracks/downloads are stored.
 */
export const saveStoredTracks = (tracks: Track[]) => {
  // 1. Primary storage: IndexedDB (handles tens of thousands of downloads without crashing)
  set(TRACKS_IDB_KEY, tracks).catch((err) => {
    console.error('Failed to save tracks to IndexedDB', err);
  });

  // 2. Secondary lightweight cache: localStorage (capped to avoid QuotaExceededError crash)
  try {
    const cacheSubset = tracks.length > 80 ? tracks.slice(0, 80) : tracks;
    localStorage.setItem(STORAGE_KEYS.TRACKS_METADATA, JSON.stringify(cacheSubset));
  } catch (err) {
    console.warn('localStorage quota reached or unavailable; tracks safely preserved in IndexedDB', err);
  }
};

export const loadStoredPlaylists = (): Playlist[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (!raw) return INITIAL_PLAYLISTS;
    const parsed: Playlist[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : INITIAL_PLAYLISTS;
  } catch {
    return INITIAL_PLAYLISTS;
  }
};

export const saveStoredPlaylists = (playlists: Playlist[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  } catch (err) {
    console.error('Failed to save playlists', err);
  }
};

export const loadStoredEq = (): EqualizerSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQ_SETTINGS);
    if (!raw) return DEFAULT_EQ_SETTINGS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EQ_SETTINGS;
  }
};

export const saveStoredEq = (eq: EqualizerSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(eq));
  } catch (err) {
    console.error('Failed to save EQ', err);
  }
};

export const loadStoredTheme = (): AppTheme => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
    return raw || 'dark-amoled';
  } catch {
    return 'dark-amoled';
  }
};

export const saveStoredTheme = (theme: AppTheme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme', err);
  }
};

// IndexedDB Audio Blob storage for true offline playback
export const storeAudioBlobOffline = async (trackId: string, blob: Blob): Promise<void> => {
  await set(`${STORAGE_KEYS.OFFLINE_BLOB_PREFIX}${trackId}`, blob);
};

export const getAudioBlobOffline = async (trackId: string): Promise<Blob | undefined> => {
  return await get(`${STORAGE_KEYS.OFFLINE_BLOB_PREFIX}${trackId}`);
};

export const removeAudioBlobOffline = async (trackId: string): Promise<void> => {
  await del(`${STORAGE_KEYS.OFFLINE_BLOB_PREFIX}${trackId}`);
};
