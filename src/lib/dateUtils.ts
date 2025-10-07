// Utilities to parse dates from the API as local dates
export function parseDateLocal(value?: string | null): Date | null {
  if (!value && value !== "0") return null;
  try {
    const s = String(value);
    // If format is YYYY-MM-DD (no time), create a local date at midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(s + "T00:00:00");
    }
    // If it already contains a time or timezone, fall back to Date constructor
    return new Date(s);
  } catch (e) {
    return null;
  }
}

export function formatDateLocal(
  value?: string | null,
  locale = "es-ES",
  opts?: Intl.DateTimeFormatOptions
) {
  const d = parseDateLocal(value);
  if (!d) return "-";
  return d.toLocaleDateString(locale, opts);
}
