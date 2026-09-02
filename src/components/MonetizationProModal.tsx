import React, { useState } from 'react';
import {
  X,
  Crown,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  Headphones,
  Sliders,
  Scissors,
  Mic,
  Star,
  Award
} from 'lucide-react';

interface MonetizationProModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProUser: boolean;
  onUpgradeToPro: (plan: 'lifetime' | 'yearly' | 'monthly') => void;
}

export const MonetizationProModal: React.FC<MonetizationProModalProps> = ({
  isOpen,
  onClose,
  isProUser,
  onUpgradeToPro,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'yearly' | 'monthly'>('lifetime');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchasedSuccess, setPurchasedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPurchasedSuccess(true);
      onUpgradeToPro(selectedPlan);
      setTimeout(() => {
        setPurchasedSuccess(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="monetization-pro-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/30 text-zinc-100 shadow-[0_0_50px_rgba(245,158,11,0.15)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-lg mb-3">
            <Crown className="w-7 h-7 fill-black" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            SONANCE <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">PRO</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Unlock the ultimate studio audiophile experience & viral creator tools
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 my-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">Ad-Free Experience</p>
              <p className="text-[10px] text-zinc-400">Completely remove banner or interstitial ads</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">AI Beat & Instrumental Isolation</p>
              <p className="text-[10px] text-zinc-400">Exporting pure beats, drums, bass & studio stems</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">Lossless Audio & HD Equalizer</p>
              <p className="text-[10px] text-zinc-400">Unlocking 10-band EQ, tube warmers, 3D Reverb, and Bass Boost</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">Exclusive Themes</p>
              <p className="text-[10px] text-zinc-400">Custom gradient and OLED AMOLED themes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">Advanced Trimmer & Tag Editor</p>
              <p className="text-[10px] text-zinc-400">Batch ID3 tag editor and high-precision ringtone export</p>
            </div>
          </div>
        </div>

        {/* Pricing Tier Selector */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {/* Monthly: 0.99 */}
          <div
            id="plan-selector-monthly"
            onClick={() => setSelectedPlan('monthly')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
              selectedPlan === 'monthly'
                ? 'bg-zinc-800 border-amber-400 shadow-md scale-102'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-zinc-400">Monthly</span>
            <p className="text-base font-black text-white my-1">$0.99</p>
            <span className="text-[9px] text-zinc-500">per month</span>
          </div>

          {/* Yearly: 4.99 (Best Value) */}
          <div
            id="plan-selector-yearly"
            onClick={() => setSelectedPlan('yearly')}
            className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
              selectedPlan === 'yearly'
                ? 'bg-gradient-to-b from-amber-500/20 to-amber-900/20 border-amber-400 shadow-lg scale-105'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[8px] font-black text-black uppercase tracking-wider shadow">
              BEST VALUE
            </span>
            <span className="text-[10px] font-bold uppercase text-amber-400 mt-1">Yearly</span>
            <p className="text-base font-black text-white my-1">$4.99</p>
            <span className="text-[9px] text-amber-400/90 font-bold">$0.41 / mo</span>
          </div>

          {/* Lifetime: 9.99 */}
          <div
            id="plan-selector-lifetime"
            onClick={() => setSelectedPlan('lifetime')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
              selectedPlan === 'lifetime'
                ? 'bg-zinc-800 border-amber-400 shadow-md scale-102'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-zinc-400">Lifetime</span>
            <p className="text-base font-black text-white my-1">$9.99</p>
            <span className="text-[9px] text-zinc-500">One-time pay</span>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isProcessing || isProUser}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          {purchasedSuccess ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-black stroke-[3]" />
              <span>PRO UNLOCKED!</span>
            </span>
          ) : isProcessing ? (
            <span className="animate-pulse">Processing Google Play Purchase...</span>
          ) : isProUser ? (
            <span>You Are Already Pro!</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 fill-black" />
              <span>Upgrade to PRO Now</span>
            </span>
          )}
        </button>

        {/* Guarantee & AdMob simulation text */}
        <p className="text-center text-[10px] text-zinc-500 mt-3">
          Instant activation • 30-day money-back guarantee • Works offline
        </p>
      </div>
    </div>
  );
};
