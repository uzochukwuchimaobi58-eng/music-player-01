import React, { useState } from 'react';
import {
  X,
  MessageSquareHeart,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import { submitUserFeedback } from '../services/feedbackService';
import { UserFeedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColorHex?: string;
  nightMode?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  accentColorHex = '#f5b731',
  nightMode = true,
}) => {
  const [category, setCategory] = useState<UserFeedback['category']>('feature_request');
  const [message, setMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { id: UserFeedback['category']; label: string; icon: string }[] = [
    { id: 'feature_request', label: 'Feature Suggestion', icon: '💡' },
    { id: 'audio_quality', label: 'Audio Quality', icon: '🎧' },
    { id: 'ui_design', label: 'Design & Themes', icon: '🎨' },
    { id: 'performance', label: 'Speed & Smoothness', icon: '⚡' },
    { id: 'general', label: 'General Praise', icon: '🌟' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage('Please write a brief feedback message (at least 5 characters).');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await submitUserFeedback({
        category,
        message: message.trim(),
        userEmail: userEmail.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit feedback to Firestore:', err);
      setErrorMessage('Could not save feedback to the database. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setUserEmail('');
    setCategory('feature_request');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div
      id="feedback-modal"
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          nightMode ? 'bg-[#141416] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          nightMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${accentColorHex}25`, color: accentColorHex }}
            >
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Send Feedback</h2>
              <p className="text-xs text-zinc-400">Share your thoughts, suggestions, and wishes with us</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh]">
          {isSuccess ? (
            /* Professional Thank You View */
            <div id="feedback-thank-you-view" className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div
                className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-emerald-500/20"
                style={{ backgroundColor: `${accentColorHex}20`, color: accentColorHex }}
              >
                <Heart className="w-10 h-10 fill-current animate-pulse text-rose-500" />
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Your feedback has been successfully saved to our cloud database. Every piece of advice helps us elevate the audio fidelity, aesthetics, and performance of Sonance Music Player.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left text-xs text-zinc-300 max-w-sm mx-auto space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Firestore
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Category:</span>
                  <span className="capitalize text-zinc-200 font-medium">{category.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-black shadow-lg transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: accentColorHex }}
                >
                  Done
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl font-medium text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  Send Another Feedback
                </button>
              </div>
            </div>
          ) : (
            /* Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Select Topic / Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        category === cat.id
                          ? 'border-amber-400/80 bg-amber-500/15 text-white shadow-sm'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                      style={{
                        borderColor: category === cat.id ? accentColorHex : undefined,
                        backgroundColor: category === cat.id ? `${accentColorHex}20` : undefined,
                      }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Professional Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Your Feedback & Suggestions <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {message.length} / 2000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you love, features you would like added (e.g. lyrics editing, custom widgets), or how we can improve your listening experience..."
                  className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all resize-none ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-amber-400/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-amber-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Optional Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email Address <span className="text-zinc-500 font-normal lowercase">(optional, for replies)</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-amber-400/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-amber-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Error message if any */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-98 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: accentColorHex }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firestore Database...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
