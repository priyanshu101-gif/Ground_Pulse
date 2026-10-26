import { GroundStatus, ReportSubmissionInput, ValidationResult } from '../types/index.ts';

const VALID_STATUSES: GroundStatus[] = ['Available', 'Occupied', 'Unknown'];
const MAX_NOTE_LENGTH = 280;
const MAX_SPORT_LENGTH = 60;

/**
 * Strips dangerous HTML / script tags from free text inputs
 */
export function sanitizeInput(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove tags
    .trim();
}

/**
 * Validates a user-submitted availability report before dispatching to Supabase or Demo Store
 */
export function validateReportSubmission(input: Partial<ReportSubmissionInput>): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Ground ID validation
  if (!input.ground_id || typeof input.ground_id !== 'string' || input.ground_id.trim().length === 0) {
    errors.ground_id = 'Please select a valid campus ground.';
  }

  // 2. Status validation
  if (!input.status) {
    errors.status = 'Please select the current ground status.';
  } else if (!VALID_STATUSES.includes(input.status)) {
    errors.status = `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`;
  }

  // 3. Sport validation
  if (input.sport_in_progress && input.sport_in_progress.length > MAX_SPORT_LENGTH) {
    errors.sport_in_progress = `Sport name cannot exceed ${MAX_SPORT_LENGTH} characters.`;
  }

  // 4. Note validation
  if (input.note) {
    const trimmed = input.note.trim();
    if (trimmed.length > MAX_NOTE_LENGTH) {
      errors.note = `Note must be ${MAX_NOTE_LENGTH} characters or less (currently ${trimmed.length}).`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
