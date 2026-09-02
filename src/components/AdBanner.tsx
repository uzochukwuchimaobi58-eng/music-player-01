import React, { useState } from 'react';
import { Sparkles, Crown, X, ExternalLink, Headphones } from 'lucide-react';

interface AdBannerProps {
  isProUser: boolean;
  onOpenProModal: () => void;
  position?: 'bottom' | 'inline';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  isProUser,
  onOpenProModal,
  position = 'bottom',
}) => {
  const [dismissedInSession, setDismissedInSession] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If user is Pro, NO ads are ever rendered!
  if (isProUser || dismissedInSession) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToastMessage('Upgrade to Sonance Pro ($0.99/mo) to permanently remove all banner & audio ads.');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    setDismissedInSession(true);
  };

  return (
    <div
      id="sponsored-ad-banner"
      className={`w-full z-20 transition-all font-sans select-none ${
        position === 'bottom'
          ? 'px-3 py-1.5 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md'
          : 'my-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
        {/* Ad Branding & Content */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
            Ad
          </span>
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-100 truncate">
                SoundWave Studio Pro-X Wireless
              </span>
              <span className="text-[10px] text-amber-400 font-semibold shrink-0 hidden sm:inline">
                • 40% Off Limited Time
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              Ultra-low latency Hi-Fi Bluetooth audio with lossless AptX HD
            </p>
          </div>
        </div>

        {/* Action: Remove Ads Pro CTA */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenProModal}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Crown className="w-3 h-3 text-amber-300" />
            <span className="hidden xs:inline">Remove Ads</span>
            <span className="xs:hidden">No Ads</span>
            <span className="text-[9px] bg-white/20 px-1 rounded">$0.99</span>
          </button>

          <button
            onClick={handleDismiss}
            title="Dismiss ad"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="text-[10px] text-amber-400 text-center py-1 font-medium animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
