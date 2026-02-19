import i18n from './i18n';

/** Map i18n language codes to full locale codes */
const LOCALE_MAP: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
};

function getLocale(): string {
  return LOCALE_MAP[i18n.language] || 'es-CO';
}

/**
 * Format a number with locale-appropriate separators.
 * @param value - The numeric value to format.
 * @param options - Optional `Intl.NumberFormat` options.
 * @returns Formatted string (e.g. `"1.234.567"` for es-CO).
 *
 * @example
 * formatNumber(1234567); // "1.234.567" (es) or "1,234,567" (en)
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

/**
 * Format a number as currency using the active locale.
 * @param value - Amount to format.
 * @param currency - ISO 4217 currency code (defaults to `'COP'`).
 * @param options - Optional overrides for `Intl.NumberFormat`.
 * @returns Formatted currency string (e.g. `"$ 1.500.000"`).
 */
export function formatCurrency(
  value: number,
  currency = 'COP',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/**
 * Format a number as a percentage string.
 * @param value - The value in human-readable form (e.g. `85` for 85%).
 * @param decimals - Fraction digits (default `1`).
 * @returns Formatted percentage (e.g. `"85,0 %"`).
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format a date using the active locale and optional format options.
 * @param date - Date object, ISO string, or Unix timestamp.
 * @param options - `Intl.DateTimeFormat` options.
 * @returns Locale-formatted date string.
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getLocale(), options).format(d);
}

/**
 * Format a date as a short date string (e.g. `"18 feb 2026"` / `"Feb 18, 2026"`).
 * @param date - Date object, ISO string, or Unix timestamp.
 * @returns Short-form date string.
 */
export function formatShortDate(date: Date | string | number): string {
  return formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date with day, abbreviated month, hours, and minutes.
 * @param date - Date object, ISO string, or Unix timestamp.
 * @returns Date+time string (e.g. `"18 feb, 14:30"`).
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date as a human-readable relative time string.
 * Falls back to `formatShortDate` for dates older than 30 days.
 * @param date - Date object, ISO string, or Unix timestamp.
 * @returns Relative time string (e.g. `"hace 2 horas"` / `"2 hours ago"`).
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 30) return rtf.format(-diffDay, 'day');
  return formatShortDate(d);
}

/**
 * Format a number in compact notation (e.g. `"1,2 K"`, `"3,4 M"`).
 * @param value - The numeric value.
 * @returns Compact formatted string.
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
