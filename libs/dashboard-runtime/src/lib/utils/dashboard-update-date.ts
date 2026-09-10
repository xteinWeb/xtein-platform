/** Formats the backend's calendar date and time without changing its timezone. */
export function formatDashboardUpdateDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const input = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)?)?$/.exec(input);
  const local = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(input);
  if (!iso && !local) return undefined;
  const parts = iso ?? local!;
  const year = Number(iso ? parts[1] : parts[3]);
  const month = Number(parts[2]);
  const day = Number(iso ? parts[3] : parts[1]);
  const hour = Number(parts[4] ?? 0);
  const minute = Number(parts[5] ?? 0);
  const second = Number(parts[6] ?? 0);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return undefined;
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${pad(day)}/${pad(month)}/${String(year).padStart(4, '0')} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}
