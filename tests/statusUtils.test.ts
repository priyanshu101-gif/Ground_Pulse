import { describe, it, expect } from 'vitest';
import {
  computeFreshness,
  determineEffectiveStatus,
  formatRelativeTime,
  calculateHaversineDistance,
} from '../src/utils/statusUtils.ts';
import { GroundReport } from '../src/types/index.ts';

describe('statusUtils', () => {
  const referenceNow = new Date('2026-10-26T12:00:00Z');

  describe('computeFreshness', () => {
    it('marks report under 15 minutes as fresh', () => {
      const fiveMinsAgo = new Date(referenceNow.getTime() - 5 * 60 * 1000);
      const res = computeFreshness(fiveMinsAgo, referenceNow, { freshMinutes: 15, agingMinutes: 60 });

      expect(res.category).toBe('fresh');
      expect(res.isStale).toBe(false);
      expect(res.ageMinutes).toBe(5);
    });

    it('marks report between 15 and 60 minutes as aging', () => {
      const thirtyMinsAgo = new Date(referenceNow.getTime() - 30 * 60 * 1000);
      const res = computeFreshness(thirtyMinsAgo, referenceNow, { freshMinutes: 15, agingMinutes: 60 });

      expect(res.category).toBe('aging');
      expect(res.isStale).toBe(false);
      expect(res.ageMinutes).toBe(30);
    });

    it('marks report over 60 minutes as stale/expired', () => {
      const ninetyMinsAgo = new Date(referenceNow.getTime() - 90 * 60 * 1000);
      const res = computeFreshness(ninetyMinsAgo, referenceNow, { freshMinutes: 15, agingMinutes: 60 });

      expect(res.category).toBe('stale');
      expect(res.isStale).toBe(true);
      expect(res.ageMinutes).toBe(90);
    });
  });

  describe('determineEffectiveStatus', () => {
    it('returns Unknown when no report has ever been submitted', () => {
      const res = determineEffectiveStatus(null, referenceNow);
      expect(res.effectiveStatus).toBe('Unknown');
      expect(res.isConfirmedLive).toBe(false);
      expect(res.freshness).toBeNull();
    });

    it('maintains live status when report is fresh', () => {
      const report: GroundReport = {
        id: 'rep-1',
        ground_id: 'ground-1',
        status: 'Available',
        submitted_at: new Date(referenceNow.getTime() - 4 * 60 * 1000).toISOString(),
      };

      const res = determineEffectiveStatus(report, referenceNow, { freshMinutes: 15, agingMinutes: 60 });
      expect(res.effectiveStatus).toBe('Available');
      expect(res.isConfirmedLive).toBe(true);
      expect(res.freshness?.category).toBe('fresh');
    });

    it('demotes a stale report to Unknown and marks not live', () => {
      const report: GroundReport = {
        id: 'rep-2',
        ground_id: 'ground-1',
        status: 'Occupied',
        sport_in_progress: 'Soccer',
        submitted_at: new Date(referenceNow.getTime() - 120 * 60 * 1000).toISOString(),
      };

      const res = determineEffectiveStatus(report, referenceNow, { freshMinutes: 15, agingMinutes: 60 });
      // Critical requirement: Stale reports must never be presented as confirmed live availability!
      expect(res.effectiveStatus).toBe('Unknown');
      expect(res.isConfirmedLive).toBe(false);
      expect(res.freshness?.isStale).toBe(true);
      expect(res.displayStatus).toContain('Expired');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats seconds as Just now', () => {
      const recent = new Date(referenceNow.getTime() - 20 * 1000);
      expect(formatRelativeTime(recent, referenceNow)).toBe('Just now');
    });

    it('formats minutes accurately', () => {
      const past = new Date(referenceNow.getTime() - 15 * 60 * 1000);
      expect(formatRelativeTime(past, referenceNow)).toBe('15 mins ago');
    });

    it('formats hours accurately', () => {
      const past = new Date(referenceNow.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(past, referenceNow)).toBe('2 hrs ago');
    });
  });

  describe('calculateHaversineDistance', () => {
    it('calculates distance between Stanford coordinates', () => {
      // Oval to Tennis courts (~0.8km)
      const dist = calculateHaversineDistance(37.429, -122.1685, 37.425, -122.176);
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThan(1.5);
    });
  });
});
