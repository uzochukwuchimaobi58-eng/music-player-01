import { registerPlugin, WebPlugin } from '@capacitor/core';
import { Song, ScanResult } from '../types';

export interface MusicLibraryPlugin {
  scan(): Promise<ScanResult>;
  scanSongs(): Promise<ScanResult>;
}

export class MusicLibraryWeb extends WebPlugin implements MusicLibraryPlugin {
  async scan(): Promise<ScanResult> {
    // In web browser preview environment, check if local storage or file system has tracks
    console.info('MusicLibrary running on web. For native Android, queries MediaStore.Audio.Media via MusicLibraryPlugin.kt');
    return {
      songs: [],
      count: 0
    };
  }

  async scanSongs(): Promise<ScanResult> {
    return this.scan();
  }
}

export const MusicLibrary = registerPlugin<MusicLibraryPlugin>('MusicLibrary', {
  web: () => new MusicLibraryWeb(),
});
