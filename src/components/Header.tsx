import React, { useState } from 'react';
import { Menu, Search, X, FolderSync, ShieldCheck, Crown, Scissors } from 'lucide-react';
import { Track } from '../types';

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
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenScanModal,
  onOpenProModal,
  onOpenRingtoneTrimmer,
  searchQuery,
  onSearchChange,
  activeViewTitle,
  onBackToHome,
  offlineCount,
  totalTracks,
  isProUser = false,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/95 border-b border-zinc-800 text-zinc-100 select-none backdrop-blur-md"
    >
      {/* Left section: Hamburger / Back */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeViewTitle && activeViewTitle !== 'Music Player' ? (
          <button
            id="btn-back-to-home"
            onClick={onBackToHome}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-indigo-400 transition-colors">‹ Home</span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white line-clamp-1">{activeViewTitle}</h1>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-xs flex items-center justify-center">
                <div className="w-0.5 h-3 bg-black mx-[0.5px]"></div>
                <div className="w-0.5 h-1.5 bg-black mx-[0.5px]"></div>
                <div className="w-0.5 h-3.5 bg-black mx-[0.5px]"></div>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>SONANCE</span>
                {isProUser && (
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-500 text-black px-1.5 py-0.2 rounded font-black">
                    PRO
                  </span>
                )}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3 h-3" />
              <span>{offlineCount}/{totalTracks} Offline Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Right section: Pro upgrade, Trimmer, Search, Scan Library */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {showSearchInput ? (
          <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
            <input
              id="search-tracks-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search songs, artists..."
              autoFocus
              className="w-44 sm:w-64 px-3 py-1.5 pr-8 text-xs rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-400 transition-all font-sans"
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
          <>
            {/* Pro Upgrade pill */}
            {onOpenProModal && (
              <button
                id="btn-header-go-pro"
                onClick={onOpenProModal}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isProUser
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-md active:scale-95'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline sm:inline">{isProUser ? 'PRO' : 'PRO'}</span>
              </button>
            )}

            {/* Ringtone shortcut */}
            {onOpenRingtoneTrimmer && (
              <button
                id="btn-header-ringtone"
                onClick={onOpenRingtoneTrimmer}
                title="Ringtone Cutter"
                className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/70 transition-colors cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-scan-library-header"
              onClick={onOpenScanModal}
              title="Scan / Storage folders"
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer"
            >
              <FolderSync className="w-4 h-4 text-indigo-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-black" />
            </button>

            <button
              id="btn-search-toggle"
              onClick={() => setShowSearchInput(true)}
              aria-label="Search music"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
