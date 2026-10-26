import { describe, it, expect } from 'vitest';
import { validateReportSubmission, sanitizeInput } from '../src/utils/validation.ts';

describe('validation', () => {
  describe('validateReportSubmission', () => {
    it('approves a valid report submission', () => {
      const res = validateReportSubmission({
        ground_id: '11111111-1111-1111-1111-111111111111',
        status: 'Available',
        note: 'Courts are wide open.',
      });

      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects missing ground_id', () => {
      const res = validateReportSubmission({
        ground_id: '',
        status: 'Available',
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.ground_id).toBeDefined();
    });

    it('rejects invalid status', () => {
      const res = validateReportSubmission({
        ground_id: '11111111-1111-1111-1111-111111111111',
        // @ts-expect-error testing invalid status string
        status: 'Partially_Occupied',
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.status).toContain('Must be one of');
    });

    it('rejects oversized note exceeding 280 characters', () => {
      const longNote = 'a'.repeat(281);
      const res = validateReportSubmission({
        ground_id: '11111111-1111-1111-1111-111111111111',
        status: 'Occupied',
        note: longNote,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.note).toContain('280 characters or less');
    });

    it('rejects oversized sport name exceeding 60 characters', () => {
      const longSport = 's'.repeat(65);
      const res = validateReportSubmission({
        ground_id: '11111111-1111-1111-1111-111111111111',
        status: 'Occupied',
        sport_in_progress: longSport,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.sport_in_progress).toBeDefined();
    });
  });

  describe('sanitizeInput', () => {
    it('strips angle brackets to prevent injection', () => {
      const dirty = '<script>alert("hack")</script>Hello World';
      expect(sanitizeInput(dirty)).toBe('scriptalert("hack")/scriptHello World');
    });

    it('trims excess whitespace', () => {
      expect(sanitizeInput('   Turf is open   ')).toBe('Turf is open');
    });

    it('handles null and undefined gracefully', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });
});
