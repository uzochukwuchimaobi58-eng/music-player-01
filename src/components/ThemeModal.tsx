import React, { useState } from 'react';
import { X, Palette, Check, Moon, Sun, Sparkles, Crown, Lock } from 'lucide-react';
import { AppTheme } from '../types';
import { THEMES, ThemeDefinition } from '../data/themes';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  isProUser?: boolean;
  onOpenProModal?: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  isProUser = false,
  onOpenProModal,
}) => {
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const themeList: ThemeDefinition[] = Object.values(THEMES);

  const handleSelect = (th: ThemeDefinition) => {
    if (th.isProOnly && !isProUser) {
      setLockedToast(`"${th.name}" is an exclusive Pro theme. Upgrade to unlock OLED AMOLED & Custom Gradients!`);
      if (onOpenProModal) {
        setTimeout(() => {
          onOpenProModal();
        }, 600);
      }
      return;
    }
    setLockedToast(null);
    onSelectTheme(th.id);
  };

  return (
    <div
      id="theme-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <Palette className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Themes & UI Styles
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Select a theme to transform the interface
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked Pro Alert Toast if attempted */}
        {lockedToast && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{lockedToast}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenProModal?.();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-bold text-[10px] shrink-0 hover:bg-amber-300 cursor-pointer"
            >
              Get Pro ($0.99/mo)
            </button>
          </div>
        )}

        {/* Content with theme cards and mini 6-tile preview */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3">
          {themeList.map((th) => {
            const isSelected = currentTheme === th.id;
            const isLocked = th.isProOnly && !isProUser;

            return (
              <div
                key={th.id}
                id={`theme-card-${th.id}`}
                onClick={() => handleSelect(th)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'ring-2 ring-white border-transparent shadow-2xl scale-[1.01]'
                    : isLocked
                    ? 'border-zinc-800/80 hover:border-amber-500/40 bg-zinc-900/40'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                }`}
                style={{
                  background: isSelected ? th.bgCanvas : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: th.accentColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white tracking-tight">
                          {th.name}
                        </p>
                        {th.isDark ? (
                          <Moon className="w-3 h-3 text-zinc-400" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-400" />
                        )}
                        {th.isProOnly && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            {th.themeType === 'amoled' ? 'PRO OLED' : 'PRO GRADIENT'}
                          </span>
                        )}
                        {!th.isProOnly && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {th.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isLocked ? (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                      <Lock className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-zinc-700 group-hover:border-zinc-500 flex items-center justify-center shrink-0 text-transparent">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* 6-tile color palette strip preview */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 mr-1">
                    Palette:
                  </span>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.library.bg }}
                    title="Library"
                  >
                    L
                  </div>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.folder.bg }}
                    title="Folder"
                  >
                    F
                  </div>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.favorite.bg }}
                    title="Favorite"
                  >
                    ♥
                  </div>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.recentPlay.bg }}
                    title="Recent Play"
                  >
                    ▶
                  </div>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.recentAdd.bg }}
                    title="Recent Add"
                  >
                    +
                  </div>
                  <div
                    className="w-5 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: th.cards.mostPlay.bg }}
                    title="Most Play"
                  >
                    ♬
                  </div>
                  <div
                    className="w-5 h-5 rounded-full ml-auto shadow-xs border border-white/20"
                    style={{ backgroundColor: th.accentColor }}
                    title="Accent / FAB"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Changes apply instantly to all screens</span>
          </div>

          <button
            id="btn-apply-theme-confirm"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};
