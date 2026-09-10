import { registerPlugin, WebPlugin, PluginListenerHandle } from '@capacitor/core';
import { ScanResult } from '../types';

export interface PlaybackStateEvent {
  status: 'preparing' | 'playing' | 'paused' | 'completed' | 'error';
  duration?: number;
  position?: number;
}

export interface PlaybackProgressEvent {
  currentPosition: number; // in milliseconds
  duration: number; // in milliseconds
}

export interface PlaybackErrorEvent {
  status: string;
  what?: number;
  extra?: number;
  message: string;
}

export interface MediaActionEvent {
  type: 'play' | 'pause' | 'next' | 'previous' | 'seekTo' | 'close' | 'favorite';
  position?: number;
}

export interface TrackAutoAdvancedEvent {
  id: string;
  index: number;
  title: string;
  artist: string;
}

export interface NativeQueueItem {
  id: string;
  uri?: string;
  title: string;
  artist: string;
  album?: string;
  coverArt?: string;
  duration?: number;
  isFavorite?: boolean;
}

export interface MusicLibraryPlugin {
  checkAudioPermission(): Promise<{ granted: boolean }>;
  requestAudioPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  scan(): Promise<ScanResult>;
  scanSongs(): Promise<ScanResult>;
  playTrack(options: {
    uri?: string;
    id?: string;
    title?: string;
    artist?: string;
    album?: string;
    coverArt?: string;
    duration?: number;
    isFavorite?: boolean;
    queue?: NativeQueueItem[];
    currentIndex?: number;
    repeatMode?: string;
    isShuffle?: boolean;
  }): Promise<{ status: string; duration?: number; position?: number }>;
  setQueue(options: {
    queue: NativeQueueItem[];
    currentIndex?: number;
    currentId?: string;
    repeatMode?: string;
    isShuffle?: boolean;
  }): Promise<void>;
  setPlaybackMode(options: {
    repeatMode?: string;
    isShuffle?: boolean;
  }): Promise<void>;
  playNext(): Promise<{ success: boolean }>;
  playPrevious(): Promise<{ success: boolean }>;
  pause(): Promise<{ status: string }>;
  resume(): Promise<{ status: string }>;
  seekTo(options: { position: number }): Promise<{ position: number }>;
  setVolume(options: { volume: number }): Promise<void>;
  updateNotification(options: {
    title: string;
    artist: string;
    album?: string;
    coverArt?: string;
    isPlaying: boolean;
    duration: number;
    currentTime: number;
    isFavorite?: boolean;
  }): Promise<void>;
  hideNotification(): Promise<void>;
  getPlaybackStatus(): Promise<{ isPlaying: boolean; currentPosition: number; duration: number }>;
  getArtwork?(options: { songId?: string; uri?: string; albumId?: string }): Promise<{ artwork: string | null }>;
  setKaraokeMode(options: { enabled: boolean; vocalAttenuationPercent?: number }): Promise<void>;
  setStemMix(options: { vocalLevel: number; beatBoost: number; bassLevel: number; instrumentalLevel: number }): Promise<void>;
  applyEqualizer(options: { enabled: boolean; bands: { [freq: number]: number }; bassBoost?: number; trebleBoost?: number }): Promise<void>;
  readAudioData(options: { uri?: string; id?: string }): Promise<{ filePath?: string; base64?: string; size?: number }>;
  saveAudioFile(options: { filename: string; base64Data: string; title?: string; artist?: string; duration?: number; isRingtone?: boolean; setAsRingtone?: boolean }): Promise<{ success: boolean; uri?: string; filename?: string; ringtoneSet?: boolean }>;
  setAsRingtone(options: { uri?: string; id?: string; title?: string }): Promise<{ success: boolean; uri?: string; title?: string; message?: string }>;
  addListener(
    eventName: 'playbackStateChange',
    listenerFunc: (state: PlaybackStateEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'playbackProgress',
    listenerFunc: (progress: PlaybackProgressEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'playbackCompleted',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'trackAutoAdvanced',
    listenerFunc: (event: TrackAutoAdvancedEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'playbackError',
    listenerFunc: (err: PlaybackErrorEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'mediaAction',
    listenerFunc: (action: MediaActionEvent) => void
  ): Promise<PluginListenerHandle>;
}

export class MusicLibraryWeb extends WebPlugin implements MusicLibraryPlugin {
  async checkAudioPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestAudioPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestNotificationPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async scan(): Promise<ScanResult> {
    console.info('MusicLibrary running on web. For native Android, queries MediaStore.Audio.Media via MusicLibraryPlugin.kt');
    return {
      songs: [],
      count: 0
    };
  }

  async scanSongs(): Promise<ScanResult> {
    return this.scan();
  }

  async playTrack(_options: { uri?: string; id?: string }): Promise<{ status: string }> {
    return { status: 'web-fallback' };
  }

  async setQueue(_options: { queue: NativeQueueItem[] }): Promise<void> {}

  async setPlaybackMode(_options: { repeatMode?: string; isShuffle?: boolean }): Promise<void> {}

  async playNext(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async playPrevious(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async pause(): Promise<{ status: string }> {
    return { status: 'paused' };
  }

  async resume(): Promise<{ status: string }> {
    return { status: 'playing' };
  }

  async seekTo(options: { position: number }): Promise<{ position: number }> {
    return { position: options.position };
  }

  async setVolume(_options: { volume: number }): Promise<void> {}

  async updateNotification(_options: {
    title: string;
    artist: string;
    album?: string;
    coverArt?: string;
    isPlaying: boolean;
    duration: number;
    currentTime: number;
    isFavorite?: boolean;
  }): Promise<void> {}

  async hideNotification(): Promise<void> {}

  async getPlaybackStatus(): Promise<{ isPlaying: boolean; currentPosition: number; duration: number }> {
    return { isPlaying: false, currentPosition: 0, duration: 0 };
  }

  async getArtwork(_options: { songId?: string }): Promise<{ artwork: string | null }> {
    return { artwork: null };
  }

  async setKaraokeMode(_options: { enabled: boolean; vocalAttenuationPercent?: number }): Promise<void> {}

  async setStemMix(_options: { vocalLevel: number; beatBoost: number; bassLevel: number; instrumentalLevel: number }): Promise<void> {}

  async applyEqualizer(_options: { enabled: boolean; bands: { [freq: number]: number }; bassBoost?: number; trebleBoost?: number }): Promise<void> {}

  async readAudioData(_options: { uri?: string; id?: string }): Promise<{ filePath?: string; base64?: string; size?: number }> {
    return {};
  }

  async saveAudioFile(_options: { filename: string; base64Data: string; title?: string; artist?: string; duration?: number; isRingtone?: boolean; setAsRingtone?: boolean }): Promise<{ success: boolean; uri?: string; filename?: string; ringtoneSet?: boolean }> {
    return { success: true, filename: _options.filename, ringtoneSet: _options.setAsRingtone };
  }

  async setAsRingtone(_options: { uri?: string; id?: string; title?: string }): Promise<{ success: boolean; uri?: string; title?: string; message?: string }> {
    return { success: true, title: _options.title, message: `Set "${_options.title}" as ringtone.` };
  }
}

export const MusicLibrary = registerPlugin<MusicLibraryPlugin>('MusicLibrary', {
  web: () => new MusicLibraryWeb(),
});
