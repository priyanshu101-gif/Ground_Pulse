import { FreshnessCategory, FreshnessInfo, GroundReport, GroundStatus, EffectiveStatusInfo } from '../types/index.ts';

/**
 * Default freshness thresholds in minutes
 */
export const DEFAULT_FRESHNESS_THRESHOLDS = {
  freshMinutes: 15,
  agingMinutes: 60,
};

/**
 * Retrieve configured freshness thresholds from Vite environment variables or defaults
 */
export function getFreshnessThresholds(): { freshMinutes: number; agingMinutes: number } {
  const envFresh = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FRESHNESS_FRESH_MINUTES
    ? parseInt(import.meta.env.VITE_FRESHNESS_FRESH_MINUTES, 10)
    : NaN;

  const envAging = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FRESHNESS_AGING_MINUTES
    ? parseInt(import.meta.env.VITE_FRESHNESS_AGING_MINUTES, 10)
    : NaN;

  return {
    freshMinutes: !isNaN(envFresh) && envFresh > 0 ? envFresh : DEFAULT_FRESHNESS_THRESHOLDS.freshMinutes,
    agingMinutes: !isNaN(envAging) && envAging > 0 ? envAging : DEFAULT_FRESHNESS_THRESHOLDS.agingMinutes,
  };
}

/**
 * Formats a timestamp into human-readable relative duration
 */
export function formatRelativeTime(submittedAt: string | Date, now: Date = new Date()): string {
  const date = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  }
  if (minutes === 1) {
    return '1 min ago';
  }
  if (minutes < 60) {
    return `${minutes} mins ago`;
  }
  if (hours === 1) {
    return '1 hr ago';
  }
  if (hours < 24) {
    return `${hours} hrs ago`;
  }
  if (days === 1) {
    return '1 day ago';
  }
  return `${days} days ago`;
}

/**
 * Calculates freshness category and metadata for a given report
 */
export function computeFreshness(
  submittedAt: string | Date,
  now: Date = new Date(),
  customThresholds?: { freshMinutes: number; agingMinutes: number }
): FreshnessInfo {
  const date = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const thresholds = customThresholds || getFreshnessThresholds();
  
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const ageMinutes = Math.floor(diffMs / (1000 * 60));
  const formattedAge = formatRelativeTime(date, now);

  let category: FreshnessCategory;
  let confidenceLabel: string;
  let badgeColorClass: string;

  if (ageMinutes < thresholds.freshMinutes) {
    category = 'fresh';
    confidenceLabel = 'Fresh report';
    badgeColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (ageMinutes <= thresholds.agingMinutes) {
    category = 'aging';
    confidenceLabel = 'Aging report';
    badgeColorClass = 'text-amber-700 bg-amber-50 border-amber-200';
  } else {
    category = 'stale';
    confidenceLabel = 'Stale / Expired';
    badgeColorClass = 'text-stone-600 bg-stone-100 border-stone-200';
  }

  return {
    category,
    ageMinutes,
    formattedAge,
    confidenceLabel,
    badgeColorClass,
    isStale: category === 'stale',
  };
}

/**
 * Computes the authoritative effective status of a ground.
 * CRITICAL RULE: A stale report (> agingMinutes) is NEVER presented as live confirmed availability.
 * If stale, effective status becomes 'Unknown' with an explicit explanation of when the last report was submitted.
 */
export function determineEffectiveStatus(
  latestReport?: GroundReport | null,
  now: Date = new Date(),
  customThresholds?: { freshMinutes: number; agingMinutes: number }
): EffectiveStatusInfo {
  if (!latestReport) {
    return {
      effectiveStatus: 'Unknown',
      displayStatus: 'Unknown (No reports)',
      isConfirmedLive: false,
      freshness: null,
      sport: null,
      note: null,
      lastReportedAt: null,
    };
  }

  const freshness = computeFreshness(latestReport.submitted_at, now, customThresholds);

  if (freshness.isStale) {
    // Expired reports become Unknown to prevent students walking to an outdated status
    return {
      effectiveStatus: 'Unknown',
      displayStatus: `Unknown (Expired · ${latestReport.status} ${freshness.formattedAge})`,
      isConfirmedLive: false,
      freshness,
      sport: latestReport.sport_in_progress || null,
      note: latestReport.note || null,
      lastReportedAt: latestReport.submitted_at,
    };
  }

  // Active fresh or aging report
  const displayStatus = latestReport.status;

  return {
    effectiveStatus: latestReport.status,
    displayStatus,
    isConfirmedLive: freshness.category === 'fresh',
    freshness,
    sport: latestReport.sport_in_progress || null,
    note: latestReport.note || null,
    lastReportedAt: latestReport.submitted_at,
  };
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // 2 decimal places
}
