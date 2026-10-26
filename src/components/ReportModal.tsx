import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { Ground, GroundStatus } from '../types/index.ts';
import { submitGroundReport } from '../services/reportService.ts';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  grounds: Ground[];
  preselectedGroundId?: string | null;
  onReportSubmitted: () => void;
  isDemoMode: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  grounds,
  preselectedGroundId,
  onReportSubmitted,
  isDemoMode,
}) => {
  const [selectedGroundId, setSelectedGroundId] = useState<string>('');
  const [status, setStatus] = useState<GroundStatus>('Available');
  const [sportInProgress, setSportInProgress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ isDemo: boolean } | null>(null);

  useEffect(() => {
    if (preselectedGroundId) {
      setSelectedGroundId(preselectedGroundId);
    } else if (grounds.length > 0 && !selectedGroundId) {
      setSelectedGroundId(grounds[0].id);
    }
  }, [preselectedGroundId, grounds, selectedGroundId]);

  if (!isOpen) return null;

  const currentGround = grounds.find((g) => g.id === selectedGroundId);
  const supportedSports = currentGround?.supported_sports || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!selectedGroundId) {
      setFieldErrors({ ground_id: 'Please select a campus ground.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitGroundReport({
        ground_id: selectedGroundId,
        status,
        sport_in_progress: sportInProgress.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to submit availability report.');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      } else {
        setSuccessInfo({ isDemo: Boolean(result.isDemoSubmission) });
        onReportSubmitted();
        setTimeout(() => {
          setSuccessInfo(null);
          setNote('');
          setSportInProgress('');
          onClose();
        }, 1600);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 id="report-modal-title" className="text-base font-bold text-stone-900">
              Report Ground Availability
            </h2>
            <p className="text-xs text-stone-500">
              Help fellow campus students know what’s open right now.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success notification banner */}
        {successInfo ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Report Successfully Logged!</h3>
            <p className="text-xs text-stone-600 max-w-sm">
              {successInfo.isDemo
                ? 'Your report has been saved to your local Demo Session. Status and freshness timers updated.'
                : 'Your report is now live in the Supabase PostgreSQL database for the whole campus.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {/* Database mode callout */}
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              isDemoMode ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {isDemoMode
                  ? 'Demo Mode Active: This submission updates your local session and recalculates freshness instantly.'
                  : 'Connected to Supabase: Submissions are stored persistently in PostgreSQL.'}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Ground */}
            <div>
              <label htmlFor="ground-select" className="block text-xs font-bold text-stone-800 mb-1.5">
                Campus Ground *
              </label>
              <select
                id="ground-select"
                value={selectedGroundId}
                onChange={(e) => setSelectedGroundId(e.target.value)}
                className={`w-full px-3 py-2 bg-stone-50 border rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#133E2B] focus:bg-white transition-all cursor-pointer ${
                  fieldErrors.ground_id ? 'border-rose-400' : 'border-stone-200'
                }`}
              >
                {grounds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {fieldErrors.ground_id && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.ground_id}</p>
              )}
            </div>

            {/* Current Status */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                Current Ground Status *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: 'Available', label: 'Available', desc: 'Open / Free to use', color: 'emerald' },
                    { val: 'Occupied', label: 'Occupied', desc: 'Game in progress', color: 'rose' },
                    { val: 'Unknown', label: 'Unknown', desc: 'Unclear or leaving', color: 'stone' },
                  ] as const
                ).map((opt) => {
                  const isChecked = status === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setStatus(opt.val)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isChecked
                          ? opt.color === 'emerald'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                            : opt.color === 'rose'
                            ? 'bg-rose-50 border-rose-600 text-rose-950 ring-1 ring-rose-600'
                            : 'bg-stone-100 border-stone-600 text-stone-900 ring-1 ring-stone-600'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.status && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.status}</p>
              )}
            </div>

            {/* Sport in progress (recommended if Occupied) */}
            <div>
              <label htmlFor="sport-input" className="block text-xs font-bold text-stone-800 mb-1">
                Sport Being Played {status === 'Occupied' ? '(Recommended)' : '(Optional)'}
              </label>
              <input
                id="sport-input"
                type="text"
                value={sportInProgress}
                onChange={(e) => setSportInProgress(e.target.value)}
                placeholder="e.g. Soccer scrimmage, 3v3 Basketball, Tennis drill"
                maxLength={60}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#133E2B] focus:bg-white"
              />
              {/* Quick suggestion tags from ground's supported sports */}
              {supportedSports.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-stone-400">Suggestions:</span>
                  {supportedSports.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSportInProgress(sp)}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note field with character countdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="note-input" className="text-xs font-bold text-stone-800">
                  Optional Details or Field Notes
                </label>
                <span className={`text-[10px] ${note.length > 250 ? 'text-amber-600 font-bold' : 'text-stone-400'}`}>
                  {280 - note.length} chars left
                </span>
              </div>
              <textarea
                id="note-input"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Rain stopped, lights turned on, club team wrapping up at 6:00 PM..."
                maxLength={280}
                className={`w-full px-3 py-2 bg-stone-50 border rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#133E2B] focus:bg-white resize-none ${
                  fieldErrors.note ? 'border-rose-400' : 'border-stone-200'
                }`}
              />
              {fieldErrors.note && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.note}</p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#133E2B] hover:bg-[#0D2B1E] disabled:bg-stone-400 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
