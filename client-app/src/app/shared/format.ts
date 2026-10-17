/**
 * Small formatting helpers shared by the client components.
 *
 * MySQL returns dates as strings such as "2026-11-05" and timestamps as
 * "2026-10-16 15:40:00". Parsing those strings directly with new Date() is not
 * reliable in every browser, so the helpers below build the Date objects from
 * the individual parts.
 */

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday'];

/**
 * Parses a date ("2026-11-05") or a timestamp ("2026-11-05 18:30:00").
 *
 * @param value The raw value from the API.
 * @returns A Date object or null when the value cannot be parsed.
 */
export function parseSqlDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0)
  );
}

/**
 * Day number for the date badge, e.g. "05" -> "5".
 */
export function dayOfMonth(value: string): string {
  const date = parseSqlDate(value);
  return date ? String(date.getDate()) : '';
}

/**
 * Short month for the date badge, e.g. "NOV".
 */
export function monthAbbr(value: string): string {
  const date = parseSqlDate(value);
  return date ? MONTHS_SHORT[date.getMonth()] : '';
}

/**
 * Formats a date as "Thursday, 5 November 2026".
 */
export function formatDateLong(value: string): string {
  const date = parseSqlDate(value);

  if (!date) {
    return value || '';
  }

  return DAYS_LONG[date.getDay()] + ', ' + date.getDate() + ' '
    + MONTHS_LONG[date.getMonth()] + ' ' + date.getFullYear();
}

/**
 * Formats a date as "5 Nov 2026".
 */
export function formatDateShort(value: string | null | undefined): string {
  const date = parseSqlDate(value);

  if (!date) {
    return value || '';
  }

  return date.getDate() + ' ' + MONTHS_LONG[date.getMonth()].slice(0, 3) + ' '
    + date.getFullYear();
}

/**
 * Formats a MySQL time ("18:30:00") as "6:30 PM".
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const parts = value.split(':');

  if (parts.length < 2) {
    return value;
  }

  const hours = Number(parts[0]);
  const minutes = parts[1];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return hour12 + ':' + minutes + ' ' + suffix;
}

/**
 * Formats a timestamp as "16 Oct 2026, 3:40 PM".
 */
export function formatDateTime(value: string | null | undefined): string {
  const date = parseSqlDate(value);

  if (!date) {
    return value || '';
  }

  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return date.getDate() + ' ' + MONTHS_LONG[date.getMonth()].slice(0, 3) + ' '
    + date.getFullYear() + ', ' + hour12 + ':' + minutes + ' ' + suffix;
}

/**
 * Cuts a long description to a fixed length.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) {
    return '';
  }

  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '...' : text;
}

/**
 * Formats a number as Australian dollars, e.g. "$1,250.00".
 */
export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value || 0);

  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
