import type { Href, Router } from 'expo-router';
import { logger } from '@/lib/logger';

type ExpoRouter = Pick<Router, 'push' | 'replace' | 'back'>;

/**
 * Avoids a hard crash if navigation runs before the root is mounted (e.g. push from a stale listener).
 * Dynamic paths are cast to Href (typed routes require it).
 */
export function routerPushSafe(router: ExpoRouter, href: string, context?: string): void {
  try {
    router.push(href as Href);
  } catch (e) {
    logger.warn(context ?? 'router.push failed', {
      href,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

export function routerReplaceSafe(router: ExpoRouter, href: string, context?: string): void {
  try {
    router.replace(href as Href);
  } catch (e) {
    logger.warn(context ?? 'router.replace failed', {
      href,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}
