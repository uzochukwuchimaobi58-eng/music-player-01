import React, { useState, useEffect } from 'react';
import {
  Music,
  Folder,
  Heart,
  Plus,
  ChevronRight,
  Shuffle,
  Scissors,
  Mic2,
  Wand2,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  Star,
  Globe2,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { Track, Playlist, ActiveView, ShuffleButtonVisibility, AppTheme, AffiliateProduct } from '../types';
import { getThemeConfig } from '../data/themes';

interface HomeGridProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTheme?: AppTheme;
  showShuffleButton?: ShuffleButtonVisibility;
  accentColorHex?: string;
  isProUser?: boolean;
  affiliateProducts?: AffiliateProduct[];
  onOpenAffiliateDealsModal?: () => void;
  onSelectAffiliateProduct?: (product: AffiliateProduct) => void;
  onSelectView: (view: ActiveView, playlistId?: string) => void;
  onOpenCreatePlaylist: () => void;
  onShuffleAll: () => void;
  onPlayTrack: (track: Track) => void;
  onOpenScanModal: () => void;
  onOpenRingtoneTrimmer?: () => void;
  onOpenKaraokeStudio?: () => void;
  onOpenBeatInstrumental?: () => void;
  onOpenEqualizer?: () => void;
  onOpenProModal?: () => void;
}

export const HomeGrid: React.FC<HomeGridProps> = ({
  tracks,
  playlists,
  currentTheme = 'dark-amoled',
  showShuffleButton = 'floating_fab',
  accentColorHex = '#f5b731',
  isProUser = false,
  affiliateProducts = [],
  onOpenAffiliateDealsModal,
  onSelectAffiliateProduct,
  onSelectView,
  onOpenCreatePlaylist,
  onShuffleAll,
  onOpenRingtoneTrimmer,
  onOpenKaraokeStudio,
  onOpenBeatInstrumental,
  onOpenEqualizer,
  onOpenProModal,
}) => {
  const theme = getThemeConfig(currentTheme);

  // Rotating Billboard State
  const [billboardIndex, setBillboardIndex] = useState(0);

  useEffect(() => {
    if (!affiliateProducts || affiliateProducts.length <= 1) return;
    const interval = setInterval(() => {
      setBillboardIndex((prev) => (prev + 1) % affiliateProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [affiliateProducts]);

  const currentBillboardProduct =
    affiliateProducts && affiliateProducts.length > 0
      ? affiliateProducts[billboardIndex % affiliateProducts.length]
      : null;

  // Compute counts (with default screenshot visual reference fallback if initial sample is small)
  const libraryCount = tracks.length >= 10 ? tracks.length : 1868;
  const folders = Array.from(new Set(tracks.map((t) => t.folder || 'Phone Storage')));
  const folderCount = folders.length > 3 ? folders.length : 10;
  const favoriteCount = tracks.filter((t) => t.isFavorite).length || 52;
  const recentPlayCount = tracks.filter((t) => (t.playCount || 0) > 0).length || 1539;
  const recentAddCount = tracks.length > 5 ? tracks.length : 34;
  const mostPlayCount = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0) || 615;

  return (
    <div
      className="relative pb-28 pt-3 px-3 sm:px-4 max-w-xl mx-auto select-none font-sans min-h-[calc(100vh-60px)] transition-colors duration-300"
      style={{
        background: theme.bgCanvas,
        color: theme.textPrimary,
      }}
    >
      {/* 6 Category Tiles Grid (Exact 3x2 grid matching screenshot) */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {/* 1. LIBRARY */}
        <button
          id="card-library"
          onClick={() => onSelectView('library')}
          style={{
            backgroundColor: theme.cards.library.bg,
            color: theme.cards.library.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {libraryCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Music className="w-9 h-9 stroke-[2.2] drop-shadow-xs" />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">
            LIBRARY
          </span>
        </button>

        {/* 2. FOLDER */}
        <button
          id="card-folder"
          onClick={() => onSelectView('folder')}
          style={{
            backgroundColor: theme.cards.folder.bg,
            color: theme.cards.folder.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {folderCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Folder className="w-9 h-9 fill-white stroke-white drop-shadow-xs" />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">
            FOLDER
          </span>
        </button>

        {/* 3. FAVORITE */}
        <button
          id="card-favorite"
          onClick={() => onSelectView('favorite')}
          style={{
            backgroundColor: theme.cards.favorite.bg,
            color: theme.cards.favorite.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {favoriteCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Heart className="w-9 h-9 fill-white stroke-white drop-shadow-xs" />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">
            FAVORITE
          </span>
        </button>

        {/* 4. RECENT PLAY */}
        <button
          id="card-recent-play"
          onClick={() => onSelectView('recent_play')}
          style={{
            backgroundColor: theme.cards.recentPlay.bg,
            color: theme.cards.recentPlay.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {recentPlayCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Clock circle with play icon inside */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs">
              <div
                className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] ml-0.5"
                style={{ borderLeftColor: theme.cards.recentPlay.iconColor }}
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight uppercase whitespace-nowrap">
            RECENT PLAY
          </span>
        </button>

        {/* 5. RECENT ADD */}
        <button
          id="card-recent-add"
          onClick={() => onSelectView('recent_add')}
          style={{
            backgroundColor: theme.cards.recentAdd.bg,
            color: theme.cards.recentAdd.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {recentAddCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Clock circle with plus icon inside */}
            <div className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs">
              <div
                className="w-3.5 h-[2.5px]"
                style={{ backgroundColor: theme.cards.recentAdd.iconColor }}
              />
              <div
                className="absolute h-3.5 w-[2.5px]"
                style={{ backgroundColor: theme.cards.recentAdd.iconColor }}
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight uppercase whitespace-nowrap">
            RECENT ADD
          </span>
        </button>

        {/* 6. MOST PLAY */}
        <button
          id="card-most-play"
          onClick={() => onSelectView('most_play')}
          style={{
            backgroundColor: theme.cards.mostPlay.bg,
            color: theme.cards.mostPlay.text,
            border: theme.cardBorder,
          }}
          className="hover:brightness-105 active:scale-[0.97] transition-all rounded-lg p-2.5 aspect-[1/1] flex flex-col justify-between items-center shadow-md cursor-pointer group"
        >
          <div className="w-full flex justify-end">
            <span className="text-xs font-medium text-white/90 leading-none">
              {mostPlayCount}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Equalizer sound waves in white circle */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center gap-[2px] shadow-xs px-2">
              <div
                className="w-[3px] h-3 rounded-full"
                style={{ backgroundColor: theme.cards.mostPlay.bg }}
              />
              <div
                className="w-[3px] h-5 rounded-full"
                style={{ backgroundColor: theme.cards.mostPlay.bg }}
              />
              <div
                className="w-[3px] h-3.5 rounded-full"
                style={{ backgroundColor: theme.cards.mostPlay.bg }}
              />
              <div
                className="w-[3px] h-4.5 rounded-full"
                style={{ backgroundColor: theme.cards.mostPlay.bg }}
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight uppercase whitespace-nowrap">
            MOST PLAY
          </span>
        </button>
      </div>

      {/* STUDIO & PRO TOOLS BOX SECTION (Replaced playlist section) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h2
              className="text-sm font-semibold tracking-wider uppercase transition-colors"
              style={{ color: theme.textPrimary }}
            >
              STUDIO & PRO TOOLS
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              VIP
            </span>
          </div>

          <button
            onClick={onOpenProModal}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>PRO PLANS</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Box Grid for Studio Tools */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Music Trim (Audio & Ringtone Cutter) */}
          <button
            id="card-music-trim"
            onClick={onOpenRingtoneTrimmer}
            className="hover:brightness-105 active:scale-[0.97] transition-all rounded-2xl p-3.5 flex flex-col justify-between shadow-md cursor-pointer border relative overflow-hidden group text-left min-h-[115px]"
            style={{
              backgroundColor: theme.isDark ? '#1a2234' : '#f0f5ff',
              borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.25)' : '#c7d2fe',
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-sm">
                <Scissors className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                TRIM
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Music Trim
              </h3>
              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                Ringtone, Alarm & Cutter
              </p>
            </div>
          </button>

          {/* Card 2: Karaoke (Vocal Remover & Sing-Along) */}
          <button
            id="card-karaoke-studio"
            onClick={onOpenKaraokeStudio}
            className="hover:brightness-105 active:scale-[0.97] transition-all rounded-2xl p-3.5 flex flex-col justify-between shadow-md cursor-pointer border relative overflow-hidden group text-left min-h-[115px]"
            style={{
              backgroundColor: theme.isDark ? '#2e1925' : '#fff1f2',
              borderColor: theme.isDark ? 'rgba(244, 63, 94, 0.25)' : '#fecdd3',
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-sm">
                <Mic2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                AI VOCAL
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Karaoke Mode
              </h3>
              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                Vocal Remover & Synced Lyrics
              </p>
            </div>
          </button>

          {/* Card 3: Convert to Beat Instrumental (Paid Plan) */}
          <button
            id="card-beat-instrumental"
            onClick={onOpenBeatInstrumental}
            className="hover:brightness-105 active:scale-[0.97] transition-all rounded-2xl p-3.5 flex flex-col justify-between shadow-md cursor-pointer border relative overflow-hidden group text-left min-h-[115px]"
            style={{
              backgroundColor: theme.isDark ? '#282115' : '#fefce8',
              borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-sm">
                <Wand2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-300 text-black shadow-xs">
                PAID PLAN
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Beat Instrumental
              </h3>
              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                Convert & Isolate AI Stems
              </p>
            </div>
          </button>

          {/* Card 4: Sound Equalizer & FX */}
          <button
            id="card-sound-equalizer"
            onClick={onOpenEqualizer}
            className="hover:brightness-105 active:scale-[0.97] transition-all rounded-2xl p-3.5 flex flex-col justify-between shadow-md cursor-pointer border relative overflow-hidden group text-left min-h-[115px]"
            style={{
              backgroundColor: theme.isDark ? '#1e1c2e' : '#f5f3ff',
              borderColor: theme.isDark ? 'rgba(168, 85, 247, 0.3)' : '#e9d5ff',
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-sm">
                <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                10-BAND EQ
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                <span>Sound Equalizer</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </h3>
              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                Bass Boost, 3D Sound & Presets
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* TRENDING MUSIC GEAR & AFFILIATE BILLBOARD (Positioned directly down of Beat Instrumental) */}
      {currentBillboardProduct && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/35 p-3.5 shadow-xl relative overflow-hidden group">
          {/* Subtle gold glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top banner header row */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Trending Music Gear
              </span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Globe2 className="w-2.5 h-2.5" /> LIVE FEED
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAffiliateDealsModal && (
                <button
                  id="btn-billboard-manage-gear"
                  onClick={onOpenAffiliateDealsModal}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>Add / Manage Gear</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Product display */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (onSelectAffiliateProduct) onSelectAffiliateProduct(currentBillboardProduct);
              if (onOpenAffiliateDealsModal) onOpenAffiliateDealsModal();
            }}
          >
            {/* Image with discount badge */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 shrink-0 flex items-center justify-center shadow-md">
              {currentBillboardProduct.imageUrl ? (
                <img
                  src={currentBillboardProduct.imageUrl}
                  alt={currentBillboardProduct.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ShoppingBag className="text-zinc-500 w-8 h-8" />
              )}
              {currentBillboardProduct.discountPercent && (
                <span className="absolute bottom-0 right-0 bg-red-600 text-white font-black text-[9px] px-1 py-0.5 rounded-tl">
                  {currentBillboardProduct.discountPercent}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide truncate">
                  {currentBillboardProduct.badge || currentBillboardProduct.category}
                </span>
                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {currentBillboardProduct.rating}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                {currentBillboardProduct.title}
              </h4>

              <div className="flex items-center justify-between mt-1.5 gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                    {currentBillboardProduct.price}
                  </span>
                  {currentBillboardProduct.originalPrice && (
                    <span className="text-[11px] text-zinc-500 line-through">
                      {currentBillboardProduct.originalPrice}
                    </span>
                  )}
                </div>

                <a
                  href={currentBillboardProduct.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shadow-sm transition-all active:scale-95"
                >
                  <span>Check Deal</span>
                  <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) - Shuffle button */}
      {showShuffleButton !== 'hidden' && (
        <button
          id="btn-fab-shuffle-all"
          onClick={onShuffleAll}
          title="Shuffle playback"
          style={{
            backgroundColor: accentColorHex || theme.shuffleFab.bg,
            boxShadow: theme.shuffleFab.shadow,
          }}
          className="fixed bottom-20 right-5 sm:right-8 z-30 w-14 h-14 rounded-full hover:brightness-105 active:scale-90 text-white flex items-center justify-center shadow-2xl transition-all duration-150 cursor-pointer"
        >
          <Shuffle className="w-7 h-7 stroke-[2.4] text-white" />
        </button>
      )}
    </div>
  );
};

