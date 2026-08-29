import { get, set, del } from 'idb-keyval';
import { Track, Playlist, EqualizerSettings, AppTheme } from '../types';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, EQ_PRESET_MAP } from '../data/defaultTracks';

const STORAGE_KEYS = {
  TRACKS_METADATA: 'music_player_tracks_meta',
  PLAYLISTS: 'music_player_playlists',
  EQ_SETTINGS: 'music_player_eq',
  THEME: 'music_player_theme',
  VOLUME: 'music_player_volume',
  LAST_TRACK: 'music_player_last_track',
  RECENT_PLAYED: 'music_player_recent_played',
  OFFLINE_BLOB_PREFIX: 'offline_track_blob_',
};

export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: 'Hi-Fi Master',
  bands: { ...EQ_PRESET_MAP['Hi-Fi Master'] },
  bassBoost: 35,
  spatialReverb: 15,
  trebleBoost: 25,
};

export const loadStoredTracks = (): Track[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKS_METADATA);
    if (!raw) return INITIAL_TRACKS;
    const parsed: Track[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : INITIAL_TRACKS;
  } catch {
    return INITIAL_TRACKS;
  }
};

export const saveStoredTracks = (tracks: Track[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKS_METADATA, JSON.stringify(tracks));
  } catch (err) {
    console.error('Failed to save tracks metadata', err);
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
