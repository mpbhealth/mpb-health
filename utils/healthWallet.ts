/** HealthWallet (web.thehealthwallet.com) — deep-link resume so return visits skip the login gate when the session is still valid. */

export const HEALTH_WALLET_ENTRY_URL = 'https://web.thehealthwallet.com/landing-arm-mpb';

/** Product IDs that see the HealthWallet entry on home (keep in sync with home quick actions). */
export const HEALTH_WALLET_PRODUCT_IDS = new Set([
  '44036',
  '45800',
  '45388',
  '46455',
  '45742',
  '38036',
]);

export function userHasHealthWalletProduct(userData: {
  normalized_product_id?: string | null;
  product_id?: string | null;
} | null): boolean {
  if (!userData) return false;
  return HEALTH_WALLET_PRODUCT_IDS.has(
    userData.normalized_product_id ?? userData.product_id ?? '',
  );
}

export function healthWalletLastUrlStorageKey(memberId: string): string {
  return `mpb_healthwallet_last_url_${memberId}`;
}

export function isHealthWalletHost(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === 'web.thehealthwallet.com' || h.endsWith('.thehealthwallet.com');
  } catch {
    return false;
  }
}

/** True when the member was sent to an explicit auth screen — drop saved resume URL. */
export function isHealthWalletAuthGateUrl(url: string): boolean {
  try {
    const p = new URL(url).pathname.toLowerCase();
    // e.g. https://web.thehealthwallet.com/login
    return (
      p === '/login' ||
      p.startsWith('/login/') ||
      p.includes('/signin') ||
      p.includes('/sign-in') ||
      p.includes('/authenticate')
    );
  } catch {
    return false;
  }
}

/** Post-login MPB shell (same as HEALTH_WALLET_ENTRY_URL path), not generic marketing landings. */
export function isHealthWalletPartnerLandingPathname(pathname: string): boolean {
  return pathname.toLowerCase().includes('landing-arm-mpb');
}

/** Full URL is the MPB partner hub — app chrome “back” should exit HealthWallet, not WebView history. */
export function isHealthWalletPartnerLandingUrl(url: string): boolean {
  try {
    if (!url.trim()) return false;
    if (!isHealthWalletHost(url)) return false;
    return isHealthWalletPartnerLandingPathname(new URL(url).pathname);
  } catch {
    return false;
  }
}

/**
 * Safe to resume later: HTTPS on HealthWallet, not generic /landing* marketing, not auth gate.
 * /landing-arm-mpb is allowed — it is where members land after sign-in for this app.
 */
export function shouldPersistHealthWalletResumeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    if (!isHealthWalletHost(url)) return false;
    if (isHealthWalletAuthGateUrl(url)) return false;
    const p = u.pathname.toLowerCase();
    if (p.includes('/landing') && !isHealthWalletPartnerLandingPathname(p)) return false;
    return true;
  } catch {
    return false;
  }
}
