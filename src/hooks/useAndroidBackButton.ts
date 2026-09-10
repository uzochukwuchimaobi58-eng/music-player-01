import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { MusicLibrary } from '../plugins/MusicLibrary';
import { ActiveView } from '../types';

export interface BackButtonHandlers {
  // Modal / overlay states
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;

  ringtoneConfirmTrack: unknown | null;
  setRingtoneConfirmTrack: (track: null) => void;

  artworkModalTrack: unknown | null;
  setArtworkModalTrack: (track: null) => void;

  actionMenuTrack: unknown | null;
  setActionMenuTrack: (track: null) => void;

  isDriveSafetyModalOpen: boolean;
  setIsDriveSafetyModalOpen: (open: boolean) => void;

  isAffiliateDealsOpen: boolean;
  setIsAffiliateDealsOpen: (open: boolean) => void;

  isProModalOpen: boolean;
  setIsProModalOpen: (open: boolean) => void;

  isSleepTimerOpen: boolean;
  setIsSleepTimerOpen: (open: boolean) => void;

  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  setEditingPlaylist?: (val: null) => void;

  isThemeOpen: boolean;
  setIsThemeOpen: (open: boolean) => void;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  isScanOpen: boolean;
  setIsScanOpen: (open: boolean) => void;

  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;

  isHiddenFilesOpen: boolean;
  setIsHiddenFilesOpen: (open: boolean) => void;

  isRingtoneOpen: boolean;
  setIsRingtoneOpen: (open: boolean) => void;

  isKaraokeStudioOpen: boolean;
  setIsKaraokeStudioOpen: (open: boolean) => void;

  isBeatInstrumentalOpen: boolean;
  setIsBeatInstrumentalOpen: (open: boolean) => void;

  isWebBrowserOpen: boolean;
  setIsWebBrowserOpen: (open: boolean) => void;

  isEqOpen: boolean;
  setIsEqOpen: (open: boolean) => void;

  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  setLyricsTrack?: (val: null) => void;

  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;

  // View navigation states
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedPlaylistId?: (id: null) => void;

  // Toast callback for "Press back again to exit"
  onShowToast?: (message: string) => void;
}

export function useAndroidBackButton(handlers: BackButtonHandlers) {
  // Use a ref to always access the freshest state values without re-subscribing
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleBackButtonAction = async () => {
      const h = handlersRef.current;

      // 1. Splash screen
      if (h.showWelcome) {
        h.setShowWelcome(false);
        return;
      }

      // 2. High-priority popup dialogs & action sheets
      if (h.ringtoneConfirmTrack) {
        h.setRingtoneConfirmTrack(null);
        return;
      }

      if (h.artworkModalTrack) {
        h.setArtworkModalTrack(null);
        return;
      }

      if (h.actionMenuTrack) {
        h.setActionMenuTrack(null);
        return;
      }

      if (h.isDriveSafetyModalOpen) {
        h.setIsDriveSafetyModalOpen(false);
        return;
      }

      if (h.isAffiliateDealsOpen) {
        h.setIsAffiliateDealsOpen(false);
        return;
      }

      if (h.isProModalOpen) {
        h.setIsProModalOpen(false);
        return;
      }

      if (h.isSleepTimerOpen) {
        h.setIsSleepTimerOpen(false);
        return;
      }

      if (h.isPlaylistModalOpen) {
        h.setIsPlaylistModalOpen(false);
        if (h.setEditingPlaylist) h.setEditingPlaylist(null);
        return;
      }

      if (h.isThemeOpen) {
        h.setIsThemeOpen(false);
        return;
      }

      if (h.isSettingsOpen) {
        h.setIsSettingsOpen(false);
        return;
      }

      if (h.isScanOpen) {
        h.setIsScanOpen(false);
        return;
      }

      if (h.isWidgetOpen) {
        h.setIsWidgetOpen(false);
        return;
      }

      if (h.isHiddenFilesOpen) {
        h.setIsHiddenFilesOpen(false);
        return;
      }

      if (h.isRingtoneOpen) {
        h.setIsRingtoneOpen(false);
        return;
      }

      if (h.isKaraokeStudioOpen) {
        h.setIsKaraokeStudioOpen(false);
        return;
      }

      if (h.isBeatInstrumentalOpen) {
        h.setIsBeatInstrumentalOpen(false);
        return;
      }

      if (h.isWebBrowserOpen) {
        h.setIsWebBrowserOpen(false);
        return;
      }

      if (h.isEqOpen) {
        h.setIsEqOpen(false);
        return;
      }

      // 3. Drawers & panels
      if (h.isSidebarOpen) {
        h.setIsSidebarOpen(false);
        return;
      }

      if (h.isLyricsOpen) {
        h.setIsLyricsOpen(false);
        if (h.setLyricsTrack) h.setLyricsTrack(null);
        return;
      }

      if (h.isQueueOpen) {
        h.setIsQueueOpen(false);
        return;
      }

      // 4. Full screen Now Playing player -> minimize to mini-player
      if (h.isFullPlayerOpen) {
        h.setIsFullPlayerOpen(false);
        return;
      }

      // 5. Active search query -> clear search text
      if (h.searchQuery.trim().length > 0) {
        h.setSearchQuery('');
        return;
      }

      // 6. Sub-view navigation -> return back to 'home'
      if (h.activeView !== 'home') {
        if (h.activeView === 'playlist_detail') {
          if (h.setSelectedPlaylistId) h.setSelectedPlaylistId(null);
          h.setActiveView('library');
        } else {
          h.setActiveView('home');
        }
        return;
      }

      // 7. At root Home view with no open modals:
      // Prevent accidental exit! Require double-press within 2 seconds.
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // User confirmed they want to leave the app
        try {
          if (Capacitor.isNativePlatform()) {
            // First attempt to minimize task (keeps background playback playing if music is on!)
            try {
              await MusicLibrary.minimizeApp();
            } catch {
              await CapApp.minimizeApp();
            }
          }
        } catch {
          try {
            await CapApp.exitApp();
          } catch {}
        }
      } else {
        lastBackPressTimeRef.current = now;
        if (h.onShowToast) {
          h.onShowToast('Press back again to exit');
        }
      }
    };

    let backListenerHandle: PluginListenerHandle | null = null;

    // Register Capacitor hardware backButton listener
    CapApp.addListener('backButton', () => {
      handleBackButtonAction();
    }).then((handle) => {
      backListenerHandle = handle;
    }).catch((err) => {
      console.warn('Could not register Capacitor backButton listener:', err);
    });

    // Also support keyboard Escape key for testing and desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackButtonAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
