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

export interface MusicLibraryPlugin {
  scan(): Promise<ScanResult>;
  scanSongs(): Promise<ScanResult>;
  playTrack(options: { uri?: string; id?: string; title?: string; artist?: string }): Promise<{ status: string; duration?: number; position?: number }>;
  pause(): Promise<{ status: string }>;
  resume(): Promise<{ status: string }>;
  seekTo(options: { position: number }): Promise<{ position: number }>;
  setVolume(options: { volume: number }): Promise<void>;
  getPlaybackStatus(): Promise<{ isPlaying: boolean; currentPosition: number; duration: number }>;
  getArtwork?(options: { songId?: string; uri?: string; albumId?: string }): Promise<{ artwork: string | null }>;
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
    eventName: 'playbackError',
    listenerFunc: (err: PlaybackErrorEvent) => void
  ): Promise<PluginListenerHandle>;
}

export class MusicLibraryWeb extends WebPlugin implements MusicLibraryPlugin {
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

  async getPlaybackStatus(): Promise<{ isPlaying: boolean; currentPosition: number; duration: number }> {
    return { isPlaying: false, currentPosition: 0, duration: 0 };
  }

  async getArtwork(_options: { songId?: string }): Promise<{ artwork: string | null }> {
    return { artwork: null };
  }
}

export const MusicLibrary = registerPlugin<MusicLibraryPlugin>('MusicLibrary', {
  web: () => new MusicLibraryWeb(),
});
