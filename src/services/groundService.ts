import { Ground, GroundFilterOptions, GroundReport } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';
import { INITIAL_DEMO_GROUNDS, getDemoStoredReports } from './demoData.ts';
import { calculateHaversineDistance, determineEffectiveStatus } from '../utils/statusUtils.ts';

export interface GroundsFetchResult {
  grounds: Ground[];
  isDemoMode: boolean;
  error?: string | null;
}

/**
 * Fetches grounds along with their latest availability report.
 * Uses real Supabase PostgreSQL when configured, or safe Demo Mode when not configured.
 * Surfaced errors are never silently replaced by mock data when Supabase is configured.
 */
export async function getGrounds(options: GroundFilterOptions = {}): Promise<GroundsFetchResult> {
  let rawGrounds: Ground[] = [];
  let reports: GroundReport[] = [];
  const isDemo = !isSupabaseConfigured;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch grounds from Supabase
      const { data: groundsData, error: groundsError } = await supabase
        .from('grounds')
        .select('*')
        .order('name', { ascending: true });

      if (groundsError) {
        throw new Error(`Failed to load grounds from database: ${groundsError.message}`);
      }

      // 2. Fetch latest reports from Supabase
      const { data: reportsData, error: reportsError } = await supabase
        .from('ground_reports')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (reportsError) {
        throw new Error(`Failed to load ground reports from database: ${reportsError.message}`);
      }

      rawGrounds = (groundsData || []) as Ground[];
      reports = (reportsData || []) as GroundReport[];
    } catch (err) {
      // CRITICAL: Do NOT silently switch to demo mode if Supabase was configured but failed
      return {
        grounds: [],
        isDemoMode: false,
        error: err instanceof Error ? err.message : 'Unknown database error occurred',
      };
    }
  } else {
    // Safe Demo Mode fallback
    rawGrounds = [...INITIAL_DEMO_GROUNDS];
    reports = getDemoStoredReports();
  }

  // Group latest report per ground
  const latestReportByGround = new Map<string, GroundReport>();
  for (const report of reports) {
    if (!latestReportByGround.has(report.ground_id)) {
      latestReportByGround.set(report.ground_id, report);
    }
  }

  // Attach latest report & calculate distance
  const now = new Date();
  let groundsWithDetails: Ground[] = rawGrounds.map((ground) => {
    const latestReport = latestReportByGround.get(ground.id) || null;
    let distance_km: number | null = null;

    if (
      options.userLocation &&
      ground.latitude !== null &&
      ground.longitude !== null
    ) {
      distance_km = calculateHaversineDistance(
        options.userLocation.lat,
        options.userLocation.lng,
        ground.latitude,
        ground.longitude
      );
    }

    return {
      ...ground,
      latest_report: latestReport,
      distance_km,
    };
  });

  // Apply filters
  // 1. Search query (matches ground name or location description)
  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase().trim();
    groundsWithDetails = groundsWithDetails.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.location_description.toLowerCase().includes(q) ||
        g.supported_sports.some((s) => s.toLowerCase().includes(q))
    );
  }

  // 2. Sport filter
  if (options.selectedSport && options.selectedSport !== 'All') {
    groundsWithDetails = groundsWithDetails.filter((g) =>
      g.supported_sports.some(
        (s) => s.toLowerCase() === options.selectedSport?.toLowerCase()
      )
    );
  }

  // 3. Status filter (matches authoritative effective status: Available, Occupied, Unknown)
  if (options.selectedStatus && options.selectedStatus !== 'All') {
    groundsWithDetails = groundsWithDetails.filter((g) => {
      const eff = determineEffectiveStatus(g.latest_report, now);
      return eff.effectiveStatus === options.selectedStatus;
    });
  }

  // Apply sorting
  const sortBy = options.sortBy || 'name';
  groundsWithDetails.sort((a, b) => {
    if (sortBy === 'distance') {
      const distA = a.distance_km ?? null;
      const distB = b.distance_km ?? null;
      if (distA === null && distB === null) return 0;
      if (distA === null) return 1;
      if (distB === null) return -1;
      return distA - distB;
    }

    if (sortBy === 'recently_reported') {
      const timeA = a.latest_report ? new Date(a.latest_report.submitted_at).getTime() : 0;
      const timeB = b.latest_report ? new Date(b.latest_report.submitted_at).getTime() : 0;
      return timeB - timeA;
    }

    // Default: alphabetical by name
    return a.name.localeCompare(b.name);
  });

  return {
    grounds: groundsWithDetails,
    isDemoMode: isDemo,
    error: null,
  };
}

/**
 * Fetches all historical reports for a specific ground in reverse chronological order
 */
export async function getGroundReportHistory(
  groundId: string
): Promise<{ reports: GroundReport[]; error?: string | null }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('ground_reports')
        .select('*')
        .eq('ground_id', groundId)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { reports: (data || []) as GroundReport[], error: null };
    } catch (err) {
      return {
        reports: [],
        error: err instanceof Error ? err.message : 'Failed to load report history from database',
      };
    }
  }

  // Demo Mode
  const allReports = getDemoStoredReports();
  const groundHistory = allReports
    .filter((r) => r.ground_id === groundId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  return { reports: groundHistory, error: null };
}
