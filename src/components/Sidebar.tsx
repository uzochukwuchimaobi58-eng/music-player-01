import React, { useState } from 'react';
import {
  Globe,
  Radio,
  SlidersHorizontal,
  Repeat,
  Repeat1,
  Shirt,
  LayoutGrid,
  Clock,
  Car,
  Settings,
  ListMusic,
  Plus,
  ChevronDown,
  ChevronRight,
  Music2,
  ShoppingBag
} from 'lucide-react';
import { RepeatMode, AppTheme, Playlist, AffiliateProduct } from '../types';
import { getThemeConfig } from '../data/themes';
import { AffiliateBillboardHeader } from './AffiliateBillboardHeader';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  playlists?: Playlist[];
  onSelectPlaylist?: (playlistId: string) => void;
  onOpenCreatePlaylist?: () => void;
  onOpenScanModal: () => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenThemeModal: () => void;
  onOpenSettings: () => void;
  onOpenRingtoneTrimmer?: () => void;
  onOpenProModal?: () => void;
  onEnterDriveMode: () => void;
  onOpenWebBrowser?: () => void;
  onOpenWidgetModal?: () => void;
  onOpenHiddenFilesModal?: () => void;
  onQuitApp?: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  currentTheme: AppTheme;
  sleepTimerRemaining: number | null; // in seconds
  offlineCount?: number;
  isProUser?: boolean;
  affiliateProducts?: AffiliateProduct[];
  onOpenAffiliateDealsModal?: () => void;
  onSelectAffiliateProduct?: (product: AffiliateProduct) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  playlists = [],
  onSelectPlaylist,
  onOpenCreatePlaylist,
  onOpenScanModal,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenThemeModal,
  onOpenSettings,
  onEnterDriveMode,
  onOpenWebBrowser,
  onOpenWidgetModal,
  repeatMode,
  onToggleRepeat,
  sleepTimerRemaining,
  currentTheme = 'dark-amoled',
  affiliateProducts = [],
  onOpenAffiliateDealsModal,
  onSelectAffiliateProduct,
}) => {
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(true);

  if (!isOpen) return null;

  const theme = getThemeConfig(currentTheme);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleItemClick = (action?: () => void) => {
    onClose();
    if (action) action();
  };

  return (
    <div className="fixed inset-0 z-50 flex" id="sidebar-drawer-overlay">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        id="sidebar-drawer-content"
        style={{
          backgroundColor: theme.sidebarBg,
          color: theme.textPrimary,
        }}
        className="relative z-10 w-[290px] sm:w-[320px] h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-250 select-none font-sans transition-colors duration-300"
      >
        {/* Top Header: Music Gear Affiliate Billboard & Brand */}
        <AffiliateBillboardHeader
          products={affiliateProducts}
          primaryColor={theme.accentColor}
          onOpenDealsModal={() => {
            onClose();
            if (onOpenAffiliateDealsModal) onOpenAffiliateDealsModal();
          }}
          onSelectProduct={onSelectAffiliateProduct}
        />

        {/* Menu Items List */}
        <div className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
          {/* Featured Music Gear & Deals */}
          <button
            id="menu-affiliate-store"
            onClick={() => handleItemClick(onOpenAffiliateDealsModal)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left cursor-pointer group mb-1"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                Music Gear Store
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40">
              DEALS
            </span>
          </button>

          {/* 1. Web Browser (Cleaned of AD badge) */}
          <button
            id="menu-web-browser"
            onClick={() => handleItemClick(onOpenWebBrowser)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Globe className="w-5 h-5 stroke-[2] text-sky-400" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Web Browser
              </span>
            </div>
          </button>

          {/* 2. PLAYLISTS SECTION IN SIDEBAR */}
          <div className="my-1 py-1 border-t border-b border-zinc-800/60">
            <div className="flex items-center justify-between px-3 py-2 text-zinc-400">
              <button
                onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <ListMusic className="w-4 h-4" />
                <span>Playlists ({playlists.length})</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isPlaylistsExpanded ? '' : '-rotate-90'
                  }`}
                />
              </button>

              <button
                id="btn-sidebar-create-playlist"
                onClick={() => handleItemClick(onOpenCreatePlaylist)}
                title="Create new playlist"
                className="p-1 rounded hover:bg-zinc-800 text-amber-400 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {isPlaylistsExpanded && (
              <div className="space-y-0.5 px-1 py-1">
                {playlists.length > 0 ? (
                  playlists.map((pl) => (
                    <button
                      key={pl.id}
                      id={`menu-playlist-${pl.id}`}
                      onClick={() =>
                        handleItemClick(() => {
                          if (onSelectPlaylist) onSelectPlaylist(pl.id);
                        })
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Music2 className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                          {pl.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0 ml-2">
                        {pl.trackIds ? pl.trackIds.length : 0}
                      </span>
                    </button>
                  ))
                ) : (
                  <div
                    onClick={() => handleItemClick(onOpenCreatePlaylist)}
                    className="px-3 py-2 text-xs text-zinc-400 italic hover:text-zinc-200 cursor-pointer"
                  >
                    + Create your first playlist
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Scan Library */}
          <button
            id="menu-scan-library"
            onClick={() => handleItemClick(onOpenScanModal)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Radio className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Scan Library
              </span>
            </div>
          </button>

          {/* 4. Equalizer */}
          <button
            id="menu-equalizer"
            onClick={() => handleItemClick(onOpenEqualizer)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Equalizer
              </span>
            </div>
          </button>

          {/* 5. Repeat Current */}
          <button
            id="menu-repeat-current"
            onClick={() => {
              onToggleRepeat();
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5 stroke-[2] text-amber-400" />
                ) : (
                  <Repeat className="w-5 h-5 stroke-[2]" />
                )}
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Repeat Current
              </span>
            </div>
            {repeatMode === 'one' && (
              <span className="text-[10px] text-amber-400 font-bold">ON</span>
            )}
          </button>

          {/* 6. Themes */}
          <button
            id="menu-themes"
            onClick={() => handleItemClick(onOpenThemeModal)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Shirt className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Themes
              </span>
            </div>
          </button>

          {/* 7. Widget */}
          <button
            id="menu-widget"
            onClick={() => handleItemClick(onOpenWidgetModal)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <LayoutGrid className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Widget
              </span>
            </div>
          </button>

          {/* 8. Sleep timer */}
          <button
            id="menu-sleep-timer"
            onClick={() => handleItemClick(onOpenSleepTimer)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Sleep timer
              </span>
            </div>
            {sleepTimerRemaining !== null && (
              <span className="text-xs font-mono font-bold text-amber-400">
                {formatTimer(sleepTimerRemaining)}
              </span>
            )}
          </button>

          {/* 9. Drive mode */}
          <button
            id="menu-drive-mode"
            onClick={() => handleItemClick(onEnterDriveMode)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Car className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Drive mode
              </span>
            </div>
          </button>

          {/* 10. Settings */}
          <button
            id="menu-settings"
            onClick={() => handleItemClick(onOpenSettings)}
            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Settings className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-sm font-normal text-zinc-200 group-hover:text-white">
                Settings
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

