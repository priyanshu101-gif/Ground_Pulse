import React, { useEffect, useState } from 'react';
import { X, Clock, MapPin, Plus, History, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Ground, GroundReport } from '../types/index.ts';
import { determineEffectiveStatus } from '../utils/statusUtils.ts';
import { getGroundReportHistory } from '../services/groundService.ts';

interface GroundDetailModalProps {
  ground: Ground | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: (ground: Ground) => void;
  onFocusMap?: (ground: Ground) => void;
}

export const GroundDetailModal: React.FC<GroundDetailModalProps> = ({
  ground,
  isOpen,
  onClose,
  onOpenReport,
  onFocusMap,
}) => {
  const [history, setHistory] = useState<GroundReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ground) return;

    let isMounted = true;
    setIsLoadingHistory(true);
    setHistoryError(null);

    getGroundReportHistory(ground.id).then((res) => {
      if (!isMounted) return;
      if (res.error) {
        setHistoryError(res.error);
      } else {
        setHistory(res.reports);
      }
      setIsLoadingHistory(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, ground]);

  if (!isOpen || !ground) return null;

  const now = new Date();
  const eff = determineEffectiveStatus(ground.latest_report, now);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ground-detail-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-start justify-between bg-stone-50/70">
          <div>
            <h2 id="ground-detail-title" className="text-lg font-bold text-stone-900 leading-tight">
              {ground.name}
            </h2>
            <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{ground.location_description}</span>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Ground Attributes & Facility Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider mb-1">
                Supported Sports
              </span>
              <div className="flex flex-wrap gap-1 text-xs">
                {ground.supported_sports.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 bg-white border border-stone-200 rounded-md text-stone-700 font-medium"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider mb-1">
                Location & Coordinates
              </span>
              {ground.latitude !== null && ground.longitude !== null ? (
                <div className="text-xs text-stone-700 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-stone-500">
                    {ground.latitude.toFixed(4)}, {ground.longitude.toFixed(4)}
                  </span>
                  {onFocusMap && (
                    <button
                      onClick={() => {
                        onClose();
                        onFocusMap(ground);
                      }}
                      className="inline-flex items-center gap-1 text-[#133E2B] font-semibold hover:underline cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" /> Focus on map
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-stone-500 italic">No GPS coordinates mapped</span>
              )}
            </div>
          </div>

          {/* Current Live Status Block (Prominent distinction from history) */}
          <div className="border border-stone-200 rounded-2xl p-5 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                Latest Reported Status
              </span>
              {eff.freshness && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${eff.freshness.badgeColorClass}`}>
                  {eff.freshness.confidenceLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    eff.effectiveStatus === 'Available'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : eff.effectiveStatus === 'Occupied'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-stone-100 text-stone-800 border border-stone-300'
                  }`}
                >
                  {eff.effectiveStatus[0]}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-stone-900 leading-tight">
                    {eff.displayStatus}
                  </h4>
                  {eff.sport && (
                    <p className="text-xs text-stone-600 font-medium">
                      Sport being played: <span className="text-stone-900 font-semibold">{eff.sport}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenReport(ground);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#133E2B] hover:bg-[#0D2B1E] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Submit Fresh Status</span>
              </button>
            </div>

            {/* Note attached to latest report */}
            {eff.note && (
              <div className="mt-3.5 pt-3 border-t border-stone-100 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border">
                <span className="font-semibold text-stone-700">Latest Note: </span>
                <span>&ldquo;{eff.note}&rdquo;</span>
              </div>
            )}

            {/* Stale disclaimer rule */}
            {eff.freshness?.isStale && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Notice: The last report for this ground is older than 60 minutes. Because conditions change rapidly on campus, we do not present this as confirmed live availability. Please submit a new check-in if you are nearby!
              </div>
            )}
          </div>

          {/* Historical Community Reports Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-stone-500" />
                <span>Recent Community Reports</span>
              </h4>
              <span className="text-xs text-stone-400">Chronological history</span>
            </div>

            {isLoadingHistory ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#133E2B]" />
                <span>Loading report history...</span>
              </div>
            ) : historyError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{historyError}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                No past reports recorded for this ground yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((rep, idx) => {
                  const repDate = new Date(rep.submitted_at);
                  const isLatest = idx === 0;

                  return (
                    <div
                      key={rep.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        isLatest
                          ? 'bg-stone-50/90 border-stone-300'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              rep.status === 'Available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rep.status === 'Occupied'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-200 text-stone-800'
                            }`}
                          >
                            {rep.status}
                          </span>
                          {rep.sport_in_progress && (
                            <span className="text-stone-700 font-medium">
                              {rep.sport_in_progress}
                            </span>
                          )}
                          {isLatest && (
                            <span className="text-[10px] font-semibold text-[#133E2B] bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.2">
                              Current
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            {repDate.toLocaleDateString()} {repDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      </div>

                      {rep.note && (
                        <p className="text-xs text-stone-600 mt-1 italic pl-1 border-l-2 border-stone-300">
                          &ldquo;{rep.note}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
