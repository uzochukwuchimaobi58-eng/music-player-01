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
  sourceType: 'built-in' | 'synthesized' | 'user-upload' | 'stream' | 'converted';
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
  | 'emerald-forest'
  | 'crimson-ruby'
  | 'golden-luxury'
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
  tubeWarmer?: number; // 0 to 100 (Pro)
  losslessMastering?: boolean; // (Pro)
}

export type AccentColor = 'gold' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'blue';

export type QueueAfterSearchMode = 'play_now' | 'add_queue' | 'play_next';

export type ShuffleButtonVisibility = 'floating_fab' | 'header_only' | 'hidden';

export type StatusBarLyricsMode = 'off' | 'single_line' | 'karaoke_scroll';

export type LibraryTabKey = 'all' | 'folder' | 'album' | 'artist' | 'genre' | 'favorite';

export interface PlayerSettings {
  // Normal Section
  use10BandsEqualizer: boolean;
  showHiddenFiles: boolean;
  showDirectories: boolean;
  nightMode: boolean;
  keepScreenOn: boolean;
  showYouTubeSearchEntry: boolean;
  forwardAndBackward: boolean;
  queueAfterSearching: QueueAfterSearchMode;
  showShuffleButton: ShuffleButtonVisibility;
  accentColor: AccentColor;
  libraryTabOrder: LibraryTabKey[];

  // Lyrics Section
  desktopLyrics: boolean;
  carBluetoothLyrics: boolean;
  statusBarLyrics: StatusBarLyricsMode;

  // Audio Section
  shakeToPlayNext: boolean;
  swipeToChangeSongs: boolean;
  allowOthersPlaying: boolean;
  playPauseFade: boolean;
  gaplessPlayback: boolean;
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

export interface AffiliateProduct {
  id: string;
  title: string;
  category: string;
  price: string;
  originalPrice?: string;
  discountPercent?: string;
  rating: number;
  reviewsCount?: string;
  description: string;
  affiliateUrl: string;
  imageUrl?: string;
  badge?: string;
  isCustom?: boolean;
}
