/**
 * Backend timestamps are naive UTC: the server stores `datetime.utcnow()`
 * and serializes it with `.isoformat()`, which carries no "Z"/offset.
 * `new Date("2026-10-07T07:14:00")` would read that as the browser's LOCAL
 * wall clock, so every time shown in India ran 5½ hours early.
 *
 * `parseApiDate` appends "Z" to zone-less date-times so they parse as the
 * UTC instant they are; the browser's locale formatting then renders them
 * in the viewer's own time zone. Strings that already carry a zone, bare
 * dates (no time part), epoch numbers and Date objects pass through as-is.
 */
export const parseApiDate = (value?: string | number | Date | null): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') return new Date(value);
  const s = String(value).trim();
  // "2026-10-07T07:14:00(.123456)" / "2026-10-07 07:14:00" — no zone → UTC
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
