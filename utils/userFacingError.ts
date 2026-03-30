/**
 * Maps thrown values / API errors into short, non-alarming copy for alerts and UI.
 */
export function getUserFacingErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error == null || error === '') return fallback;

  if (typeof error === 'string') {
    const t = error.trim();
    return t || fallback;
  }

  if (error instanceof Error) {
    const m = error.message?.trim() || '';
    if (!m) return fallback;

    const lower = m.toLowerCase();

    if (
      lower.includes('network request failed') ||
      lower.includes('network error') ||
      lower.includes('failed to fetch') ||
      lower.includes('load failed') ||
      lower.includes('internet connection appears to be offline')
    ) {
      return "We couldn't reach the server. Check your connection and try again.";
    }

    if (
      lower.includes('aborted') ||
      lower.includes('abort') ||
      lower.includes('timeout') ||
      lower.includes('timed out')
    ) {
      return 'That took too long. Please try again.';
    }

    if (lower.includes('no_network') || lower === 'no network') {
      return 'No internet connection. Connect and try again.';
    }

    return m;
  }

  return fallback;
}
