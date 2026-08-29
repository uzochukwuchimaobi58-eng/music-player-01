import React from 'react';
import { X, Palette, Check, Sparkles, Moon, Sun } from 'lucide-react';
import { AppTheme } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const themes: {
    id: AppTheme;
    name: string;
    description: string;
    bgClass: string;
    accentClass: string;
    isDark: boolean;
  }[] = [
    {
      id: 'dark-amoled',
      name: 'Pure AMOLED Black',
      description: 'True pitch black matching original music player screenshot',
      bgClass: 'bg-[#0f0f11] border-neutral-800',
      accentClass: 'bg-amber-400',
      isDark: true,
    },
    {
      id: 'dark-slate',
      name: 'Dark Slate Gray',
      description: 'Sophisticated dark graphite with neon cyan accents',
      bgClass: 'bg-[#18202b] border-slate-700',
      accentClass: 'bg-cyan-400',
      isDark: true,
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      description: 'Deep violet & vivid electric magenta vibe',
      bgClass: 'bg-[#1b112c] border-purple-800',
      accentClass: 'bg-fuchsia-400',
      isDark: true,
    },
    {
      id: 'midnight-blue',
      name: 'Midnight Sapphire',
      description: 'Deep oceanic blue with sapphire highlights',
      bgClass: 'bg-[#0b192e] border-blue-900',
      accentClass: 'bg-sky-400',
      isDark: true,
    },
    {
      id: 'sunset-warm',
      name: 'Warm Sunset Amber',
      description: 'Cozy charcoal with rich warm sunset tones',
      bgClass: 'bg-[#1c1815] border-amber-900',
      accentClass: 'bg-amber-500',
      isDark: true,
    },
    {
      id: 'light-minimal',
      name: 'Clean Studio Light',
      description: 'High contrast crisp minimal light interface',
      bgClass: 'bg-[#f4f5f7] border-neutral-300 text-neutral-900',
      accentClass: 'bg-blue-600',
      isDark: false,
    },
  ];

  return (
    <div
      id="theme-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Themes & UI Colors</h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Visual Aesthetic & Modes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {themes.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  theme.bgClass
                } ${
                  isSelected
                    ? 'ring-2 ring-white shadow-xl scale-[1.01]'
                    : 'hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${theme.accentClass}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${theme.isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {theme.name}
                      </p>
                      {theme.isDark ? (
                        <Moon className="w-3 h-3 text-zinc-400" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-600" />
                      )}
                    </div>
                    <p className={`text-xs ${theme.isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      {theme.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};
