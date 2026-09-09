import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  Bug,
  ShieldCheck,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { submitProblemReport } from '../services/feedbackService';
import { ProblemReport } from '../types';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColorHex?: string;
  nightMode?: boolean;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  accentColorHex = '#f5b731',
  nightMode = true,
}) => {
  const [category, setCategory] = useState<ProblemReport['category']>('playback_stopped');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [stepsToReproduce, setStepsToReproduce] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [reportTicketId, setReportTicketId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const problemCategories: { id: ProblemReport['category']; label: string; icon: string }[] = [
    { id: 'playback_stopped', label: 'Audio Stops in Background', icon: '⏸️' },
    { id: 'scan_issue', label: 'Song Scanning / Missing Files', icon: '🔍' },
    { id: 'distortion', label: 'Sound Distortion or EQ', icon: '🎛️' },
    { id: 'crash_freeze', label: 'App Freeze or Sudden Crash', icon: '⚠️' },
    { id: 'ui_glitch', label: 'Visual or Layout Glitch', icon: '📱' },
    { id: 'other', label: 'Other Technical Problem', icon: '🔧' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 8) {
      setErrorMessage('Please describe the problem in a few words (at least 8 characters).');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await submitProblemReport({
        category,
        title: title.trim() || undefined,
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        userEmail: userEmail.trim() || undefined,
      });

      setReportTicketId(result.id);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit problem report:', err);
      setErrorMessage('Unable to submit your problem report to the database. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setUserEmail('');
    setCategory('playback_stopped');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div
      id="report-problem-modal"
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
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md bg-rose-500/20 text-rose-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Report a Problem</h2>
              <p className="text-xs text-zinc-400">Help us diagnose and resolve bugs swiftly</p>
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
            <div id="report-thank-you-view" className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-emerald-500/20 bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Thanks for Your Report!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  We have logged your report and system telemetry into our technical triage database. Our team investigates reported issues to maintain the highest standard of offline music playback.
                </p>
              </div>

              {/* Ticket ID Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left text-xs text-zinc-300 max-w-sm mx-auto space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Ticket ID:</span>
                  <span className="text-amber-400 font-bold">{reportTicketId}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Received & Logged
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>App Version:</span>
                  <span className="text-zinc-300">v2.4.0 (Production)</span>
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
                  Report Another Issue
                </button>
              </div>
            </div>
          ) : (
            /* Problem Report Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  What issue did you encounter?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {problemCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer text-left ${
                        category === cat.id
                          ? 'border-rose-500/80 bg-rose-500/15 text-white shadow-sm'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Issue Summary <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Songs stop playing after 3 minutes when screen is locked"
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-rose-500/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-rose-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Detailed Description <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {description.length} / 3000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe what happened, when the problem occurs, and any error message you saw..."
                  className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all resize-none ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-rose-500/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-rose-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Steps to Reproduce */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Steps to Reproduce <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Start song in background&#10;2. Lock screen or switch app&#10;3. Music stops after 2 minutes"
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm border outline-none transition-all resize-none ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-rose-500/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-rose-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Optional Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Contact Email <span className="text-zinc-500 font-normal lowercase">(optional, for updates)</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                    nightMode
                      ? 'bg-zinc-900/90 border-zinc-800 focus:border-rose-500/80 text-white placeholder-zinc-500'
                      : 'bg-zinc-100 border-zinc-300 focus:border-rose-500 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Auto Diagnostics Badge */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-zinc-500" />
                  <span>Device diagnostics will be attached automatically</span>
                </div>
                <span className="text-emerald-400 font-mono">v2.4.0</span>
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
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 flex items-center justify-center gap-2 shadow-xl shadow-rose-950/40 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Problem Report to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Problem Report</span>
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
