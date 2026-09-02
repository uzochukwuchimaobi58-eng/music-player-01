import React, { useState } from 'react';
import { X, LayoutGrid, Check, Play, SkipForward, Music, Smartphone } from 'lucide-react';
import { Track } from '../types';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
}

export const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<'compact' | 'expanded' | 'transparent'>('expanded');
  const [showNotificationPlayer, setShowNotificationPlayer] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      id="widget-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-md bg-[#18181a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Home Screen Widget</h3>
              <p className="text-[10px] text-zinc-500">Android Launcher & Lockscreen Player</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Widget Preview */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
              Live Widget Preview
            </p>

            {/* 4x2 Android Widget Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-700/80 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shrink-0">
                  {currentTrack?.coverArt ? (
                    <img
                      src={currentTrack.coverArt}
                      alt="Cover"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {currentTrack?.title || 'TION SICKNESS (Remix)'}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {currentTrack?.artist || 'ODUMODUBLVCK'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>
                <button className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center">
                  <SkipForward className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Widget Style Selection */}
          <div className="space-y-2 pt-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Widget Style
            </p>

            {[
              { id: 'expanded', title: '4x2 Standard Card', desc: 'Album Art, Controls, Title & Track Time' },
              { id: 'compact', title: '4x1 Slim Bar', desc: 'Ultra compact minimal bar for top launcher row' },
              { id: 'transparent', title: 'Glass Minimal', desc: 'Transparent frosted blur matching wallpaper' },
            ].map((style) => (
              <div
                key={style.id}
                onClick={() => setSelectedStyle(style.id as any)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedStyle === style.id
                    ? 'bg-purple-950/30 border-purple-500/50 text-white'
                    : 'bg-[#202024] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{style.title}</p>
                  <p className="text-[10px] text-zinc-500">{style.desc}</p>
                </div>
                {selectedStyle === style.id && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notification Lockscreen Player Switch */}
          <div className="p-3 rounded-xl bg-[#202024] border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-semibold text-white">Persistent Notification Bar</p>
                <p className="text-[10px] text-zinc-500">Keep playback controls active on lockscreen</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showNotificationPlayer}
              onChange={(e) => setShowNotificationPlayer(e.target.checked)}
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold transition-all cursor-pointer"
          >
            Apply Widget Settings
          </button>
        </div>
      </div>
    </div>
  );
};
