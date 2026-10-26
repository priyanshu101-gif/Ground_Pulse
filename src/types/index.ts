/**
 * GroundPulse Type Definitions
 */

export type GroundStatus = 'Available' | 'Occupied' | 'Unknown';

export type FreshnessCategory = 'fresh' | 'aging' | 'stale';

export interface Ground {
  id: string;
  name: string;
  location_description: string;
  latitude: number | null;
  longitude: number | null;
  supported_sports: string[];
  created_at: string;
  updated_at?: string;
  // Computed fields
  latest_report?: GroundReport | null;
  distance_km?: number | null;
}

export interface GroundReport {
  id: string;
  ground_id: string;
  status: GroundStatus;
  sport_in_progress?: string | null;
  note?: string | null;
  submitted_at: string;
  reporter_id?: string | null;
  is_demo?: boolean;
}

export interface FreshnessInfo {
  category: FreshnessCategory;
  ageMinutes: number;
  formattedAge: string;
  confidenceLabel: string;
  badgeColorClass: string;
  isStale: boolean;
}

export interface EffectiveStatusInfo {
  effectiveStatus: GroundStatus;
  displayStatus: string;
  isConfirmedLive: boolean;
  freshness: FreshnessInfo | null;
  sport: string | null;
  note: string | null;
  lastReportedAt: string | null;
}

export interface ReportSubmissionInput {
  ground_id: string;
  status: GroundStatus;
  sport_in_progress?: string;
  note?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface GroundFilterOptions {
  searchQuery?: string;
  selectedSport?: string;
  selectedStatus?: GroundStatus | 'All';
  sortBy?: 'name' | 'recently_reported' | 'distance';
  userLocation?: { lat: number; lng: number } | null;
}
