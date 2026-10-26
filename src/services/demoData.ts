import { Ground, GroundReport } from '../types/index.ts';

/**
 * Clearly labelled sample grounds for local testing and demo mode.
 * Real production connects directly to your Supabase PostgreSQL instance.
 */
export const INITIAL_DEMO_GROUNDS: Ground[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'North Oval Turf Field',
    location_description: 'North Campus Athletic Sector, opposite Residence Hall C. Regulation floodlit artificial turf.',
    latitude: 37.429,
    longitude: -122.1685,
    supported_sports: ['Soccer', 'Rugby', 'Ultimate Frisbee', 'Flag Football'],
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'East Quad Basketball & Pickleball Courts',
    location_description: 'Adjacent to Student Union East Plaza. Dual hard courts with double-rim hoops and lighting until 10 PM.',
    latitude: 37.4278,
    longitude: -122.1645,
    supported_sports: ['Basketball', 'Pickleball'],
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Varsity Fieldhouse & 400m Track',
    location_description: 'West Recreation District, Gate 4. 8-lane all-weather track surrounding natural turf infield.',
    latitude: 37.4262,
    longitude: -122.173,
    supported_sports: ['Track & Field', 'Cricket', 'Soccer'],
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'West Campus Tennis Center',
    location_description: 'Near Physical Sciences, 6 lighted hard courts with windscreens and practice backboard.',
    latitude: 37.425,
    longitude: -122.176,
    supported_sports: ['Tennis', 'Pickleball'],
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'South Pavilion Sand Volleyball Courts',
    location_description: 'South Campus Commons next to the Recreation Pool. Two outdoor deep-sand volleyball courts.',
    latitude: 37.4235,
    longitude: -122.167,
    supported_sports: ['Volleyball', 'Beach Volleyball'],
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Engineering Green Open Lawn',
    location_description: 'Courtyard between Engineering Hall 2 and Computer Science wing. Open natural grass lawn. (No GPS listed)',
    latitude: null, // Intentionally null to test graceful non-GPS directory handling
    longitude: null,
    supported_sports: ['Spikeball', 'Frisbee', 'Yoga', 'Cricket'],
    created_at: '2026-09-01T08:00:00Z',
  },
];

/**
 * Generate sample reports dynamically relative to now
 * to verify fresh (<15m), aging (15-60m), and stale (>60m) states in demo mode.
 */
export function getInitialDemoReports(): GroundReport[] {
  const now = Date.now();
  return [
    {
      id: 'demo-rep-1',
      ground_id: '11111111-1111-1111-1111-111111111111',
      status: 'Occupied',
      sport_in_progress: 'Soccer',
      note: 'Campus club team playing a scrimmage on full pitch. Expected to wrap up around 6:30 PM.',
      submitted_at: new Date(now - 6 * 60 * 1000).toISOString(), // 6 mins ago -> FRESH
      reporter_id: 'student_72',
      is_demo: true,
    },
    {
      id: 'demo-rep-1-old',
      ground_id: '11111111-1111-1111-1111-111111111111',
      status: 'Available',
      sport_in_progress: null,
      note: 'Field was completely clear earlier this afternoon.',
      submitted_at: new Date(now - 75 * 60 * 1000).toISOString(), // 75 mins ago -> Stale
      reporter_id: 'student_19',
      is_demo: true,
    },
    {
      id: 'demo-rep-2',
      ground_id: '22222222-2222-2222-2222-222222222222',
      status: 'Available',
      sport_in_progress: null,
      note: 'Both courts open, hoops in great condition with chain nets.',
      submitted_at: new Date(now - 28 * 60 * 1000).toISOString(), // 28 mins ago -> AGING
      reporter_id: 'student_45',
      is_demo: true,
    },
    {
      id: 'demo-rep-3',
      ground_id: '33333333-3333-3333-3333-333333333333',
      status: 'Available',
      sport_in_progress: null,
      note: 'Track open for public walking and jogging; infield is resting.',
      submitted_at: new Date(now - 42 * 60 * 1000).toISOString(), // 42 mins ago -> AGING
      reporter_id: 'student_08',
      is_demo: true,
    },
    {
      id: 'demo-rep-4',
      ground_id: '44444444-4444-4444-4444-444444444444',
      status: 'Occupied',
      sport_in_progress: 'Tennis',
      note: 'Courts 1-4 full with intramural matches; 5 and 6 waiting on players.',
      submitted_at: new Date(now - 11 * 60 * 1000).toISOString(), // 11 mins ago -> FRESH
      reporter_id: 'student_91',
      is_demo: true,
    },
    {
      id: 'demo-rep-5',
      ground_id: '55555555-5555-5555-5555-555555555555',
      status: 'Occupied',
      sport_in_progress: 'Volleyball',
      note: '4v4 pickup game on Court A.',
      submitted_at: new Date(now - 95 * 60 * 1000).toISOString(), // 95 mins ago -> STALE / EXPIRED
      reporter_id: 'student_33',
      is_demo: true,
    },
    // Ground 6 has no reports -> Unknown by default
  ];
}

const STORAGE_KEY = 'groundpulse_demo_reports';

export function getDemoStoredReports(): GroundReport[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  const initial = getInitialDemoReports();
  saveDemoReports(initial);
  return initial;
}

export function saveDemoReports(reports: GroundReport[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore storage errors
  }
}

export function addDemoReport(report: GroundReport): void {
  const current = getDemoStoredReports();
  const updated = [report, ...current];
  saveDemoReports(updated);
}

export function resetDemoData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
