import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonance.musicplayer',
  appName: 'Sonance Music',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
