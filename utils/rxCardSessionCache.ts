/**
 * In-memory RX card PDF so leaving and re-opening the screen in the same app session
 * does not refetch (feels closer to “already signed in” for the discount card flow).
 * Cross-session persistence would need file storage + size limits (PDFs vary).
 */

let cached: { memberId: string; pdfUrl: string } | null = null;

export function getRxCardSessionCache(memberId: string): string | null {
  if (cached?.memberId === memberId) return cached.pdfUrl;
  return null;
}

export function setRxCardSessionCache(memberId: string, pdfUrl: string) {
  cached = { memberId, pdfUrl };
}

export function clearRxCardSessionCache() {
  cached = null;
}
