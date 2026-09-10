import { formatDashboardUpdateDate } from './dashboard-update-date';
import { describe, expect, it } from 'vitest';

describe('Dashboard update date', () => {
  it.each([
    ['2026-09-09T14:05:07.123Z', '09/09/2026 14:05:07'],
    ['2026-09-09 14:05:07', '09/09/2026 14:05:07'],
    ['09/09/2026 14:05:07', '09/09/2026 14:05:07'],
    ['2024-02-29', '29/02/2024 00:00:00']
  ])('formats %s', (input, expected) => expect(formatDashboardUpdateDate(input)).toBe(expected));
  it.each([undefined, null, '', 'invalid', '2026-02-30', '2026-09-09T25:00:00', {}, 123])(
    'omits missing or invalid values: %s', input => expect(formatDashboardUpdateDate(input)).toBeUndefined());
});
