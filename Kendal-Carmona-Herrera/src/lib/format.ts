/**
 * Presentation helpers shared by the dashboard surfaces.
 *
 * Both functions are pure and dependency-free, so they behave the same on the
 * server and in the browser.
 */

const ELLIPSIS = "\u2026";
const DEFAULT_VISIBLE_CHARS = 4;

function normalizeVisible(visible: number): number {
  if (!Number.isFinite(visible)) return DEFAULT_VISIBLE_CHARS;
  return Math.max(1, Math.trunc(visible));
}

/**
 * `GABCD…WXYZ`. An address too short to shorten is returned untouched: trimming
 * it would hide more characters than the result shows.
 */
export function shortenAddress(
  address: string,
  visible: number = DEFAULT_VISIBLE_CHARS,
): string {
  const side = normalizeVisible(visible);

  if (address.length <= side * 2 + 1) return address;

  return `${address.slice(0, side)}${ELLIPSIS}${address.slice(-side)}`;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Horizon timestamps are ISO strings. An unparsable value is returned as-is so a
 * bad row stays visible instead of reading "Invalid Date".
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return iso;

  return DATE_TIME_FORMATTER.format(date);
}
