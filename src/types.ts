export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  uri: string;
  albumId: string;
}

export interface ScanResult {
  songs: Song[];
  count: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string; // URL or blob URL
  coverArt: string;
  folder: string;
  isFavorite: boolean;
  playCount: number;
  dateAdded: number; // timestamp
  lastPlayed?: number; // timestamp
  isOffline: boolean;
  lyrics?: string;
  bitrate?: string;
  sampleRate?: string;
  fileSize?: string;
  sourceType: 'built-in' | 'synthesized' | 'user-upload' | 'stream';
}

export interface Playlist {
  id: string;
  name: string;
  color: string;
  trackIds: string[];
  createdAt: number;
  isDefault?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type EqPreset =
  | 'Flat'
  | 'Bass Boost'
  | 'Vocal Booster'
  | 'Rock'
  | 'Electronic'
  | 'Jazz'
  | 'Acoustic'
  | 'Hi-Fi Master'
  | 'Custom';

export type AppTheme =
  | 'dark-amoled' // pure pitch black like screenshot
  | 'dark-slate'
  | 'cyberpunk'
  | 'midnight-blue'
  | 'sunset-warm'
  | 'light-minimal';

export type ActiveView =
  | 'home'
  | 'library'
  | 'folder'
  | 'favorite'
  | 'recent_play'
  | 'recent_add'
  | 'most_play'
  | 'playlist_detail'
  | 'drive_mode';

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqPreset;
  bands: { [freq: number]: number }; // frequency in Hz -> gain in dB (-12 to +12)
  bassBoost: number; // 0 to 100
  spatialReverb: number; // 0 to 100
  trebleBoost: number; // 0 to 100
}

export interface PlayerState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  hiFiMode: boolean;
}
