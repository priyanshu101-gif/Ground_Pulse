import React from 'react';
import { X, ShieldCheck, Clock, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { getFreshnessThresholds } from '../utils/statusUtils.ts';

interface FreshnessRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreshnessRulesModal: React.FC<FreshnessRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const thresholds = getFreshnessThresholds();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="freshness-modal-title"
      >
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="freshness-modal-title" className="text-base font-bold text-stone-900">
                GroundPulse Trust & Freshness Engine
              </h2>
              <p className="text-xs text-stone-500">
                How community status reporting works on campus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 leading-relaxed">
          {/* Transparency Callout */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <h3 className="font-bold text-emerald-950 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Student-Powered, Never Fake Sensors
            </h3>
            <p className="text-emerald-900">
              GroundPulse does <strong>not</strong> claim to have automatic optical cameras, LiDAR, or hardware occupancy sensors. All live status updates come directly from students on the field reporting what they see.
            </p>
          </div>

          {/* Freshness Tiers */}
          <div>
            <h4 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-600" />
              Configurable Freshness Tiers
            </h4>

            <div className="space-y-3">
              {/* Fresh */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  &lt;{thresholds.freshMinutes}m
                </div>
                <div>
                  <div className="font-bold text-emerald-900">Fresh (High Confidence)</div>
                  <p className="text-stone-600 mt-0.5">
                    Reported within the last {thresholds.freshMinutes} minutes. High probability that conditions have not changed.
                  </p>
                </div>
              </div>

              {/* Aging */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  {thresholds.freshMinutes}-{thresholds.agingMinutes}m
                </div>
                <div>
                  <div className="font-bold text-amber-900">Aging (Moderate Confidence)</div>
                  <p className="text-stone-600 mt-0.5">
                    Reported between {thresholds.freshMinutes} and {thresholds.agingMinutes} minutes ago. Good indicator, but pickup games may have started or ended.
                  </p>
                </div>
              </div>

              {/* Stale */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-100/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  &gt;{thresholds.agingMinutes}m
                </div>
                <div>
                  <div className="font-bold text-stone-900">Stale / Expired (Demoted to Unknown)</div>
                  <p className="text-stone-600 mt-0.5">
                    Older than {thresholds.agingMinutes} minutes. To avoid misleading students walking across campus, GroundPulse marks these grounds as <strong>Unknown / Stale</strong> rather than claiming confirmed availability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Database vs Community Reports */}
          <div className="border-t border-stone-100 pt-4 space-y-2">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-stone-600" />
              Verified Grounds vs. Crowd Reports
            </h4>
            <p>
              • <strong>Verified Ground Info:</strong> Ground names, GPS boundaries, lighting schedules, and supported sports are managed centrally and protected by Supabase Row Level Security (RLS).
            </p>
            <p>
              • <strong>Community Reports:</strong> Anyone on campus can submit an instant report. Server constraints limit notes to 280 characters and enforce allowed status enum values.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
