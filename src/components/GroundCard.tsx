import React from 'react';
import { MapPin, Navigation, Clock, Activity, MessageSquare } from 'lucide-react';
import { Ground } from '../types/index.ts';
import { determineEffectiveStatus } from '../utils/statusUtils.ts';

interface GroundCardProps {
  ground: Ground;
  onSelect: (ground: Ground) => void;
  onReport: (ground: Ground) => void;
  onFocusOnMap?: (ground: Ground) => void;
}

export const GroundCard: React.FC<GroundCardProps> = ({
  ground,
  onSelect,
  onReport,
  onFocusOnMap,
}) => {
  const now = new Date();
  const eff = determineEffectiveStatus(ground.latest_report, now);

  // Status visual attributes
  let statusBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let statusDotColor = 'bg-emerald-600';

  if (eff.effectiveStatus === 'Occupied') {
    statusBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
    statusDotColor = 'bg-rose-600';
  } else if (eff.effectiveStatus === 'Unknown') {
    statusBadgeStyle = 'bg-stone-100 text-stone-700 border-stone-200';
    statusDotColor = 'bg-stone-500';
  }

  return (
    <article className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        {/* Header row: Ground Name and Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-stone-900 leading-snug">
            {ground.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border whitespace-nowrap shrink-0 ${statusBadgeStyle}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusDotColor}`} aria-hidden="true"></span>
            {eff.displayStatus}
          </span>
        </div>

        {/* Location description */}
        <p className="text-xs text-stone-600 line-clamp-2 mb-3 leading-relaxed flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <span>{ground.location_description}</span>
        </p>

        {/* Supported sports list */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs text-stone-600">
          <span className="font-medium text-stone-400">Sports:</span>
          {ground.supported_sports.map((sport, index) => (
            <span key={sport} className="inline-flex items-center">
              <span className="font-medium text-stone-700">{sport}</span>
              {index < ground.supported_sports.length - 1 && (
                <span className="text-stone-300 ml-1.5" aria-hidden="true">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Latest report metadata block */}
        <div className="pt-3 border-t border-stone-100 text-xs">
          {ground.latest_report ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-stone-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reported {eff.freshness?.formattedAge}</span>
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${eff.freshness?.badgeColorClass}`}>
                  {eff.freshness?.confidenceLabel}
                </span>
              </div>

              {eff.sport && (
                <div className="text-stone-700 font-medium">
                  Sport in action: <span className="text-stone-900">{eff.sport}</span>
                </div>
              )}

              {ground.latest_report.note && (
                <p className="text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100 text-[11px] line-clamp-2 flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                  <span>&ldquo;{ground.latest_report.note}&rdquo;</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-stone-400 italic">
              <Activity className="w-3.5 h-3.5" />
              <span>No reports submitted today. Be the first to check in.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls & actions */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="text-xs text-stone-500 flex items-center gap-2">
          {ground.distance_km !== null && ground.distance_km !== undefined ? (
            <span className="flex items-center gap-1 font-medium text-stone-700">
              <Navigation className="w-3 h-3 text-emerald-700" />
              <span>{ground.distance_km} km away</span>
            </span>
          ) : (
            ground.latitude !== null && (
              <button
                onClick={() => onFocusOnMap?.(ground)}
                className="hover:text-[#133E2B] transition-colors cursor-pointer text-[11px] font-medium text-stone-500 hover:underline"
              >
                View on map
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(ground)}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Details & History
          </button>
          <button
            onClick={() => onReport(ground)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#133E2B] hover:bg-[#0D2B1E] rounded-lg transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            Update Status
          </button>
        </div>
      </div>
    </article>
  );
};
