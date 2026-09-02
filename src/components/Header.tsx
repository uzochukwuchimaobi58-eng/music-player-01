import React, { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenScanModal: () => void;
  onOpenProModal?: () => void;
  onOpenRingtoneTrimmer?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeViewTitle?: string;
  onBackToHome?: () => void;
  offlineCount: number;
  totalTracks: number;
  isProUser?: boolean;
  currentTheme?: AppTheme;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  searchQuery,
  onSearchChange,
  activeViewTitle,
  onBackToHome,
  currentTheme = 'dark-amoled',
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const theme = getThemeConfig(currentTheme);

  return (
    <header
      id="app-header"
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.headerBorder,
        color: theme.textPrimary,
      }}
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 select-none border-b transition-colors duration-300"
    >
      {/* Left section: Hamburger / Back */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="p-1 -ml-1 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          style={{ color: theme.textPrimary }}
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        {activeViewTitle && activeViewTitle !== 'Music Player' ? (
          <button
            id="btn-back-to-home"
            onClick={onBackToHome}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <span
              className="text-xs font-semibold group-hover:opacity-100 transition-opacity"
              style={{ color: theme.textSecondary }}
            >
              ‹ Back
            </span>
            <h1
              className="text-lg font-bold tracking-tight line-clamp-1"
              style={{ color: theme.textPrimary }}
            >
              {activeViewTitle}
            </h1>
          </button>
        ) : (
          <h1
            className="text-xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: theme.textPrimary }}
          >
            <span>Music Player</span>
          </h1>
        )}
      </div>

      {/* Right section: Search icon */}
      <div className="flex items-center gap-4">
        {showSearchInput ? (
          <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
            <input
              id="search-tracks-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search songs, artists..."
              autoFocus
              className="w-48 sm:w-64 px-3 py-1.5 pr-8 text-sm rounded-lg bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-400 transition-all font-sans"
            />
            <button
              id="btn-clear-search"
              onClick={() => {
                onSearchChange('');
                setShowSearchInput(false);
              }}
              className="absolute right-2.5 p-0.5 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-search-toggle"
            onClick={() => setShowSearchInput(true)}
            aria-label="Search music"
            style={{ color: theme.textPrimary }}
            className="p-1 hover:opacity-80 transition-transform active:scale-95 cursor-pointer"
          >
            <Search className="w-5 h-5 stroke-[2.3]" />
          </button>
        )}
      </div>
    </header>
  );
};

