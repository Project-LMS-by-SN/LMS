import { describe, it, expect } from 'vitest';
import { timeToMinutes, parse24To12 } from '../../../../frontend/src/utils/timeUtils';

describe('timeUtils unit tests', () => {
  describe('timeToMinutes', () => {
    it('returns null for empty input', () => {
      expect(timeToMinutes('')).toBeNull();
      expect(timeToMinutes(null)).toBeNull();
      expect(timeToMinutes(undefined)).toBeNull();
    });

    it('converts 12-hour AM string correctly', () => {
      expect(timeToMinutes('09:30 AM')).toBe(9 * 60 + 30); // 570
      expect(timeToMinutes('12:00 AM')).toBe(0); // midnight
      expect(timeToMinutes('12:45 AM')).toBe(45);
    });

    it('converts 12-hour PM string correctly', () => {
      expect(timeToMinutes('01:15 PM')).toBe(13 * 60 + 15); // 795
      expect(timeToMinutes('12:00 PM')).toBe(12 * 60); // noon (720)
      expect(timeToMinutes('11:59 PM')).toBe(23 * 60 + 59); // 1439
    });

    it('converts 24-hour string correctly', () => {
      expect(timeToMinutes('14:30')).toBe(14 * 60 + 30);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('08:00')).toBe(480);
    });
  });

  describe('parse24To12', () => {
    it('returns default 09:00 AM for empty input', () => {
      expect(parse24To12('')).toEqual({ hour12: '09', minute: '00', period: 'AM' });
      expect(parse24To12(null)).toEqual({ hour12: '09', minute: '00', period: 'AM' });
    });

    it('formats morning 24h hours to 12h AM', () => {
      const res = parse24To12('08:45');
      expect(res.period).toBe('AM');
      expect(res.minute).toBe('45');
    });

    it('formats evening 24h hours to 12h PM', () => {
      const res = parse24To12('18:20');
      expect(res.period).toBe('PM');
      expect(res.minute).toBe('20');
    });
  });
});
