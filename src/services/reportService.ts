import { GroundReport, ReportSubmissionInput } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';
import { addDemoReport } from './demoData.ts';
import { sanitizeInput, validateReportSubmission } from '../utils/validation.ts';

export interface ReportSubmitResult {
  success: boolean;
  report?: GroundReport;
  error?: string;
  fieldErrors?: Record<string, string>;
  isDemoSubmission?: boolean;
}

// Client-side debounce tracker to prevent double-click / immediate spam submissions
let lastSubmissionTimestamp = 0;
const CLIENT_SUBMISSION_COOLDOWN_MS = 3000;

/**
 * Submits a community ground availability report
 */
export async function submitGroundReport(
  rawInput: ReportSubmissionInput
): Promise<ReportSubmitResult> {
  // 1. Client debounce check
  const now = Date.now();
  if (now - lastSubmissionTimestamp < CLIENT_SUBMISSION_COOLDOWN_MS) {
    return {
      success: false,
      error: 'Please wait a couple of seconds before submitting another report.',
    };
  }

  // 2. Validate input
  const validation = validateReportSubmission(rawInput);
  if (!validation.isValid) {
    return {
      success: false,
      error: 'Please fix the errors in your report submission.',
      fieldErrors: validation.errors,
    };
  }

  // 3. Sanitize fields
  const cleanGroundId = rawInput.ground_id.trim();
  const cleanStatus = rawInput.status;
  const cleanSport = rawInput.sport_in_progress
    ? sanitizeInput(rawInput.sport_in_progress)
    : null;
  const cleanNote = rawInput.note ? sanitizeInput(rawInput.note) : null;
  const submittedAt = new Date().toISOString();

  // 4. Submit to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('ground_reports')
        .insert({
          ground_id: cleanGroundId,
          status: cleanStatus,
          sport_in_progress: cleanSport,
          note: cleanNote,
          submitted_at: submittedAt,
          reporter_id: 'community_student',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      lastSubmissionTimestamp = Date.now();
      return {
        success: true,
        report: data as GroundReport,
        isDemoSubmission: false,
      };
    } catch (err) {
      return {
        success: false,
        error: `Submission failed: ${err instanceof Error ? err.message : 'Unknown database error'}`,
        isDemoSubmission: false,
      };
    }
  }

  // 5. Safe Demo Mode fallback
  // Simulated small network latency for realistic feel
  await new Promise((resolve) => setTimeout(resolve, 300));

  const demoReport: GroundReport = {
    id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ground_id: cleanGroundId,
    status: cleanStatus,
    sport_in_progress: cleanSport,
    note: cleanNote,
    submitted_at: submittedAt,
    reporter_id: 'you_demo_student',
    is_demo: true,
  };

  addDemoReport(demoReport);
  lastSubmissionTimestamp = Date.now();

  return {
    success: true,
    report: demoReport,
    isDemoSubmission: true,
  };
}
