// src/components/common/WebViewContainer.tsx

/**
 * WebViewContainer – in-app browser with progress, error handling, and security.
 *
 * ## Enhancement presets (`enhancementPreset` / `disableEnhancements`)
 * Third-party sites differ wildly; pick a preset per screen:
 *
 * - **portal** (`disableEnhancements`) — Health portals, SSO, card UIs. Only adds a viewport meta if
 *   the page has none. No CSS or zoom hacks (avoids broken `.card-wrapper` / flex layouts).
 * - **balanced** (default) — Most marketing or form sites: light overflow + 16px inputs, preserves
 *   the site’s own viewport. No pinch / double-tap blocking, no `visualViewport` body height hacks.
 * - **full** — Simple long-form pages where you want fewer accidental zooms: everything in balanced
 *   plus pinch/double-tap guards and a keyboard `visualViewport` tweak (can still break some SPAs).
 *
 * ## Native ↔ page bridge
 * With `bridgeSafeAreaToPage`, the page gets CSS variables on `:root`:
 * `--mpb-safe-area-top|bottom|left|right` (px). Progressive enhancement for your own or partner pages.
 *
 * ## UX
 * `fadeInOnLoad` (default true) briefly fades content in after load so the shell feels like the app.
 * Loading state uses the shared `LoadingIndicator` overlay (logo + card) for consistency with other screens.
 */

import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ForwardedRef,
} from 'react';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import {
  StyleSheet,
  View,
  Platform,
  BackHandler,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Linking as RNLinking,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCw, ExternalLink } from 'lucide-react-native';
import { SmartText } from '@/components/common/SmartText';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, MIN_TOUCH_TARGET } from '@/utils/scaling';

const LOAD_TIMEOUT_MS = 25000;
const PROGRESS_RESET_DELAY_MS = 400;
const APP_UA_SUFFIX = `MPBHealth/${Constants.expoConfig?.version ?? 'dev'}`;

export type WebViewEnhancementPreset = 'portal' | 'balanced' | 'full';

/** Backward-compatible props (your existing ones) + a few optional niceties */
interface WebViewContainerProps {
  url: string;
  style?: StyleProp<ViewStyle>;
  injectedJavaScript?: string;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  scrollEnabled?: boolean;
  bounces?: boolean;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (e: any) => void;
  userAgent?: string;
  headers?: Record<string, string>;

  // keyboard props
  keyboardDisplayRequiresUserAction?: boolean;
  hideKeyboardAccessoryView?: boolean;

  // Optionally add more hosts to always open externally (regex strings)
  externalHosts?: (string | RegExp)[];

  /** Optional: show a pull-to-refresh (Android native; iOS simulated) */
  enablePullToRefresh?: boolean;

  /** Optional: dark pages look better against app background (just flips loader styles) */
  dark?: boolean;

  /** Optional: notify parent when canGoBack changes (e.g., to mirror back UX) */
  onCanGoBackChange?: (canGoBack: boolean) => void;

  /** Optional: persist session cookies for stay-signed-in functionality */
  persistCookies?: boolean;

  /** Optional: storage key for persisting cookies (default: 'webview_cookies') */
  cookieStorageKey?: string;

  /** Optional: handle nested webviews/iframes securely */
  allowNestedFrames?: boolean;

  /** Optional: disable UX enhancements for special widgets like chat (default: false) */
  disableEnhancements?: boolean;
  /**
   * How aggressively we adjust third-party pages for in-app WebViews.
   * Ignored when `disableEnhancements` is true (treated as `portal`). Default: `balanced`.
   */
  enhancementPreset?: WebViewEnhancementPreset;
  /**
   * When true, sets `--mpb-safe-area-*` on `document.documentElement` so pages can align with the
   * app chrome (opt-in usage on the web side).
   */
  bridgeSafeAreaToPage?: boolean;
  /** After first paint, fade WebView opacity 0→1 for a softer hand-off from the loading overlay. Default true. */
  fadeInOnLoad?: boolean;
  /** Copy for the shared LoadingIndicator overlay (default: same as home — “Just a moment…”). */
  loadingMessage?: string;
  /**
   * High-security mode for payment, health, and banking sites.
   * When true: HTTPS-only origin whitelist, no mixed content, no file access,
   * no cache, and blocks non-HTTPS navigation. Use for portals that require strict TLS.
   */
  highSecurity?: boolean;
  /**
   * Hosts that block or restrict in-app WebViews (e.g. Zocdoc).
   * When the initial URL matches, we show "Open in browser" UI instead of loading in WebView.
   * Pass hostnames or RegExp (e.g. [/zocdoc\.com/i]). Optional: set openInBrowserAutoOpen to open on mount.
   */
  openInBrowserHosts?: (string | RegExp)[];
  /** When true and url matches openInBrowserHosts, open in system browser immediately and show the same UI. */
  openInBrowserAutoOpen?: boolean;
  /**
   * Android-only (`react-native-webview`). Default `hardware`; `software` avoids blank repaint bugs
   * after the WebView was hidden or resized (common with off-screen “parked” portals).
   */
  androidLayerType?: 'none' | 'software' | 'hardware';
  /** Android: text zoom %; use `100` so system font size doesn’t blow up third‑party layouts. */
  textZoom?: number;
  /**
   * Android: WebView default `true` enables legacy whole-page scaling and often looks blurry on
   * responsive sites; set `false` for viewport-based layouts (typical health portals).
   */
  scalesPageToFit?: boolean;
  /** Android: improves scroll/gesture coordination (e.g. full-screen WebView + system chrome). */
  nestedScrollEnabled?: boolean;
  /**
   * Third-party portals (HealthWallet, etc.): inline/fullscreen video, file download → in-app browser,
   * `window.open` navigated in-place, and calmer camera/mic prompts for same-host uploads.
   */
  enablePortalRobustness?: boolean;
  /**
   * Android: when false, this WebView does not register `BackHandler` (avoids invisible parked
   * WebViews eating global back). Host screen should call `goBack` / `router.back()` instead.
   */
  androidHandleHardwareBack?: boolean;
}

function safeAreaInjectFragment(
  top: number,
  bottom: number,
  left: number,
  right: number,
): string {
  return `
    try {
      var r = document.documentElement;
      r.style.setProperty('--mpb-safe-area-top', '${top}px');
      r.style.setProperty('--mpb-safe-area-bottom', '${bottom}px');
      r.style.setProperty('--mpb-safe-area-left', '${left}px');
      r.style.setProperty('--mpb-safe-area-right', '${right}px');
    } catch (e) {}
`;
}

/** Injection script by preset; safe area is optional native→page bridge. */
export function buildWebViewInjectionScript(
  preset: WebViewEnhancementPreset,
  safeArea: { top: number; bottom: number; left: number; right: number } | null,
): string {
  const safe =
    safeArea != null
      ? safeAreaInjectFragment(safeArea.top, safeArea.bottom, safeArea.left, safeArea.right)
      : '';

  if (preset === 'portal') {
    return `
(function() {
  try {
    ${safe}
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(m);
    }
    if (!document.getElementById('mpb-portal-text-adjust')) {
      var adj = document.createElement('style');
      adj.id = 'mpb-portal-text-adjust';
      adj.textContent = 'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}';
      document.head.appendChild(adj);
    }
  } catch(err) {}
})();
true;
`;
  }

  const balancedBody = `
    ${safe}
    if (!document.querySelector('meta[name="viewport"]')) {
      var mv = document.createElement('meta');
      mv.name = 'viewport';
      mv.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
      document.head.insertBefore(mv, document.head.firstChild);
    }
    var style = document.createElement('style');
    style.id = 'webview-enhancements';
    style.textContent = \`
      html {
        overflow-x: hidden;
        max-width: 100%;
        -webkit-overflow-scrolling: touch;
      }
      body {
        overflow-x: hidden;
        max-width: 100%;
        margin: 0;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      }
      img, video {
        max-width: 100%;
        height: auto;
      }
      input, textarea, select, [contenteditable="true"] {
        font-size: max(16px, 1em);
      }
    \`;
    document.head.appendChild(style);
    if (window.top !== window.self) {
      console.warn('Nested iframe detected');
    }
`;

  const fullExtras = `
    var lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      var now = Date.now();
      if (now - lastTouchEnd <= 300) { e.preventDefault(); }
      lastTouchEnd = now;
    }, false);
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) { e.preventDefault(); }
    }, { passive: false });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function() {
        document.body.style.height = window.visualViewport.height + 'px';
      });
    }
    var scrollTimer;
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {}, 150);
    }, { passive: true });
`;

  if (preset === 'balanced') {
    return `
(function() {
  try {
    ${balancedBody}
  } catch(err) {
    console.error('WebView enhancement error:', err);
  }
})();
true;
`;
  }

  // full
  return `
(function() {
  try {
    ${balancedBody}
    ${fullExtras}
  } catch(err) {
    console.error('WebView enhancement error:', err);
  }
})();
true;
`;
}

export const WebViewContainer = forwardRef(
  (
    {
      url,
      style,
      injectedJavaScript = '',
      javaScriptEnabled = true,
      domStorageEnabled = true,
      scrollEnabled = true,
      bounces = true,
      onMessage,
      onNavigationStateChange,
      onLoadStart,
      onLoadEnd,
      onError,
      userAgent,
      headers,

      // keyboard props
      keyboardDisplayRequiresUserAction = false,
      hideKeyboardAccessoryView = false,

      // external host overrides
      externalHosts = [],

      // extras
      enablePullToRefresh = false,
      dark = false,
      onCanGoBackChange,
      persistCookies = true,
      cookieStorageKey = 'webview_cookies',
      allowNestedFrames = false,
      disableEnhancements = false,
      enhancementPreset = 'balanced',
      bridgeSafeAreaToPage = false,
      fadeInOnLoad = true,
      loadingMessage,
      highSecurity = false,
      openInBrowserHosts = [],
      openInBrowserAutoOpen = false,
      androidLayerType = 'hardware',
      textZoom,
      scalesPageToFit,
      nestedScrollEnabled,
      enablePortalRobustness = false,
      androidHandleHardwareBack = true,
    }: WebViewContainerProps,
    ref: ForwardedRef<WebView>,
  ) => {
    const insets = useSafeAreaInsets();
    const resolvedPreset: WebViewEnhancementPreset = disableEnhancements ? 'portal' : enhancementPreset;
    const safeAreaForBridge =
      bridgeSafeAreaToPage
        ? { top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right }
        : null;

    const fadeAnim = useRef(new Animated.Value(fadeInOnLoad ? 0 : 1)).current;

    const [isLoading, setIsLoading] = useState(true);
    const [cookies, setCookies] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    const [progress, setProgress] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    const [refreshing, setRefreshing] = useState(false);

    const canGoBackRef = useRef(false);
    const webViewRef = useRef<WebView>(null);
    useImperativeHandle(ref, () => webViewRef.current as any);

    const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    // UA defaults
    const ANDROID_CHROME_UA =
      'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
    const IOS_SAFARI_UA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

    const defaultUA = useMemo(
      () =>
        Platform.select({
          android: ANDROID_CHROME_UA,
          ios: IOS_SAFARI_UA,
          default: ANDROID_CHROME_UA,
        })!,
      [],
    );

    const androidWebViewExtraProps = useMemo(() => {
      if (Platform.OS !== 'android') {
        return {};
      }
      const extra: {
        androidLayerType: 'none' | 'software' | 'hardware';
        textZoom?: number;
        scalesPageToFit?: boolean;
        nestedScrollEnabled?: boolean;
      } = { androidLayerType };
      if (textZoom != null) extra.textZoom = textZoom;
      if (scalesPageToFit != null) extra.scalesPageToFit = scalesPageToFit;
      if (nestedScrollEnabled != null) extra.nestedScrollEnabled = nestedScrollEnabled;
      return extra;
    }, [androidLayerType, nestedScrollEnabled, scalesPageToFit, textZoom]);

    // High-security: HTTPS-only whitelist; otherwise allow all origins for compatibility
    const originWhitelist = useMemo(
      () => (highSecurity ? ['https://*'] : ['*']),
      [highSecurity],
    );

    // External open rules
    const ALWAYS_EXTERNAL_HOSTS: (RegExp | string)[] = useMemo(
      () => [
        /(^|\.)accounts\.google\.com$/i,
        /(^|\.)paypal\.com$/i,
        ...externalHosts,
      ],
      [externalHosts],
    );

    const urlToHost = (u: string) => {
      try {
        return new URL(u).hostname;
      } catch {
        return '';
      }
    };

    const urlHostMatches = (u: string, patterns: (string | RegExp)[]) => {
      const host = urlToHost(u);
      if (!host) return false;
      return patterns.some((p) =>
        typeof p === 'string' ? host === p || host.endsWith('.' + p) : p.test(host),
      );
    };

    const shouldOpenInBrowser = useMemo(
      () => openInBrowserHosts.length > 0 && urlHostMatches(url, openInBrowserHosts),
      [url, openInBrowserHosts],
    );

    const shouldOpenExternally = (u: string) => {
      const host = urlToHost(u);
      return ALWAYS_EXTERNAL_HOSTS.some((p) =>
        typeof p === 'string' ? host === p : p.test(host),
      );
    };

    const openExternal = async (u: string) => {
      try {
        await WebBrowser.openBrowserAsync(u, {
          enableBarCollapsing: true,
          showTitle: true,
        });
      } catch {
        RNLinking.openURL(u);
      }
    };

    const handlePortalOpenWindow = useCallback((event: { nativeEvent: { targetUrl?: string } }) => {
      const targetUrl = event.nativeEvent?.targetUrl;
      if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) return;
      webViewRef.current?.injectJavaScript(
        `window.location.replace(${JSON.stringify(targetUrl)}); true;`,
      );
    }, []);

    const handlePortalFileDownload = useCallback((event: { nativeEvent: { downloadUrl?: string } }) => {
      const u = event.nativeEvent?.downloadUrl;
      if (!u) return;
      void WebBrowser.openBrowserAsync(u, { enableBarCollapsing: true, showTitle: true }).catch(() => {
        RNLinking.openURL(u).catch(() => {});
      });
    }, []);

    const portalRobustnessProps = useMemo(() => {
      if (!enablePortalRobustness) {
        return null;
      }
      const base: Record<string, unknown> = {
        onOpenWindow: handlePortalOpenWindow,
      };
      if (Platform.OS === 'ios') {
        base.allowsInlineMediaPlayback = true;
        base.mediaCapturePermissionGrantType = 'grantIfSameHostElsePrompt';
        base.onFileDownload = handlePortalFileDownload;
      }
      if (Platform.OS === 'android') {
        base.allowsFullscreenVideo = true;
      }
      return base;
    }, [enablePortalRobustness, handlePortalFileDownload, handlePortalOpenWindow]);

    // When URL is in openInBrowserHosts and auto-open is on, open in browser on mount
    useEffect(() => {
      if (!shouldOpenInBrowser || !openInBrowserAutoOpen || !url) return;
      openExternal(url);
    }, [shouldOpenInBrowser, openInBrowserAutoOpen, url]);

    // Save/load cookies for persistent login
    useEffect(() => {
      if (persistCookies) {
        AsyncStorage.getItem(cookieStorageKey).then((stored) => {
          if (stored) setCookies(stored);
        });
      }
    }, [persistCookies, cookieStorageKey]);

    // Save cookies when they change (for persistent sign-in)
    const saveCookies = async (newCookies: string) => {
      if (persistCookies && newCookies) {
        try {
          await AsyncStorage.setItem(cookieStorageKey, newCookies);
          setCookies(newCookies);
        } catch (err) {
          console.error('Failed to save cookies:', err);
        }
      }
    };

    // Android hardware back → WebView back first, then let navigator decide
    useEffect(() => {
      if (Platform.OS !== 'android' || !androidHandleHardwareBack) {
        return;
      }
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isMountedRef.current && canGoBackRef.current && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }, [androidHandleHardwareBack]);

    // Progress bar animation
    useEffect(() => {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [progress, progressAnim]);

    const handleLoadStart = () => {
      if (!isMountedRef.current) return;
      if (fadeInOnLoad) {
        fadeAnim.setValue(0);
      }
      setIsLoading(true);
      setHasError(false);
      onLoadStart?.();
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setRefreshing(false);
        // If onLoadEnd never runs (SPAs / client-side redirects), fade can stay at 0 while the
        // overlay hides — looks like a permanent blank screen.
        if (fadeInOnLoad) {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      }, LOAD_TIMEOUT_MS);
    };

    const handleLoadEnd = useCallback(() => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (!isMountedRef.current) return;
      setIsLoading(false);
      setRefreshing(false);
      onLoadEnd?.();
      setProgress(1);
      if (fadeInOnLoad) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
      setTimeout(() => {
        if (isMountedRef.current) setProgress(0);
      }, PROGRESS_RESET_DELAY_MS);
    }, [onLoadEnd, fadeInOnLoad, fadeAnim]);

    const handleLoadError = (e: any) => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (!isMountedRef.current) return;
      setIsLoading(false);
      setRefreshing(false);
      setHasError(true);
      if (fadeInOnLoad) {
        fadeAnim.setValue(1);
      }
      onError?.(e);
    };

    const handleProgress = (e: any) => {
      if (!isMountedRef.current) return;
      const p = e?.nativeEvent?.progress ?? 0;
      setProgress(p);
    };

    const handleNavChange = (navState: WebViewNavigation) => {
      if (!isMountedRef.current) return;
      const next = !!navState?.canGoBack;
      canGoBackRef.current = next;
      onCanGoBackChange?.(next);

      const navUrl = navState.url ?? '';
      if (
        navState.loading === false &&
        navUrl.length > 0 &&
        !/^about:/i.test(navUrl)
      ) {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        setIsLoading(false);
        setRefreshing(false);
        if (fadeInOnLoad) {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      }

      // Check for nested iframes (security)
      if (!allowNestedFrames && navState.url?.includes('iframe')) {
        console.warn('Nested iframe detected in:', navState.url);
      }

      onNavigationStateChange?.(navState);
    };

    const handleRetry = () => {
      if (!isMountedRef.current) return;
      setHasError(false);
      setIsLoading(true);
      webViewRef.current?.reload();
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setIsLoading(false);
      }, 20000);
    };

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      };
    }, []);

    const isCalendly = url.includes('calendly.com');
    const calendlyHtml = useMemo(
      () =>
        `
      <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>html, body {margin:0; padding:0; height:100%;}</style>
      </head><body>
      <div id="widget" style="height:100%;"></div>
      <script src="https://assets.calendly.com/assets/external/widget.js"></script>
      <script>
        Calendly.initInlineWidget({
          url: "${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
          parentElement: document.getElementById("widget")
        });
      </script>
      </body></html>
    `.trim(),
      [url],
    );

    const webSource = useMemo(() => {
      if (isCalendly) {
        return { html: calendlyHtml };
      }
      const merged: Record<string, string> = {};
      if (cookies) merged.Cookie = cookies;
      if (headers && Object.keys(headers).length > 0) {
        Object.assign(merged, headers);
      }
      if (Object.keys(merged).length === 0) {
        return { uri: url };
      }
      return { uri: url, headers: merged };
    }, [url, cookies, headers, isCalendly, calendlyHtml]);

    const uxInject = useMemo(
      () => buildWebViewInjectionScript(resolvedPreset, safeAreaForBridge),
      [
        resolvedPreset,
        bridgeSafeAreaToPage,
        insets.top,
        insets.bottom,
        insets.left,
        insets.right,
      ],
    );
    const combinedInjectedJS = `${uxInject}\n;${injectedJavaScript || ''}`;

    // Sites that block WebViews: show "Open in browser" UI instead of loading in WebView
    if (shouldOpenInBrowser) {
      return (
        <View style={[styles.container, dark && styles.containerDark]}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrap}>
              <ExternalLink size={moderateScale(40)} color={colors.primary.main} />
            </View>
            <SmartText
              variant="h3"
              style={[styles.errorTitle, dark && styles.errorTitleDark]}
              maxLines={2}
            >
              Opens in your browser
            </SmartText>
            <SmartText
              variant="body1"
              style={[styles.errorText, dark && styles.errorTextDark]}
              maxLines={4}
            >
              This site doesn't support in-app viewing. Tap below to open it in your browser for the best experience.
            </SmartText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => openExternal(url)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Open in browser"
            >
              <ExternalLink size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.retryButtonText}>Open in Browser</SmartText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={[styles.container, dark && styles.containerDark]}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrap}>
              <RefreshCw size={moderateScale(40)} color={colors.status.error} />
            </View>
            <SmartText
              variant="h3"
              style={[styles.errorTitle, dark && styles.errorTitleDark]}
              maxLines={2}
            >
              Something went wrong
            </SmartText>
            <SmartText
              variant="body1"
              style={[styles.errorText, dark && styles.errorTextDark]}
              maxLines={3}
            >
              We couldn't load this page. Check your connection or try opening it in your browser.
            </SmartText>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Retry loading page"
              >
                <RefreshCw size={moderateScale(20)} color={colors.background.default} />
                <SmartText variant="body1" style={styles.retryButtonText}>Retry</SmartText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.openButton}
                onPress={() => openExternal(url)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Open in browser"
              >
                <ExternalLink size={moderateScale(20)} color={colors.text.primary} />
                <SmartText variant="body1" style={styles.openButtonText}>Open in Browser</SmartText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, dark && { backgroundColor: colors.background.paper }]}>
        {/* Top progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              opacity: progressAnim.interpolate({
                inputRange: [0, 0.01, 1],
                outputRange: [0, 1, 0],
              }),
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }) as any,
            },
          ]}
        />

        <Animated.View style={[styles.webViewOuter, { opacity: fadeAnim }]}>
          <WebView
          ref={webViewRef as any}
          {...(portalRobustnessProps ?? {})}
          originWhitelist={originWhitelist}
          source={webSource}
          style={[styles.webview, style]}
          injectedJavaScript={combinedInjectedJS}
          javaScriptEnabled={javaScriptEnabled}
          domStorageEnabled={domStorageEnabled}
          mixedContentMode={highSecurity ? 'never' : 'always'}
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          scrollEnabled={scrollEnabled}
          bounces={bounces}
          onMessage={onMessage}
          onNavigationStateChange={handleNavChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleLoadError}
          onLoadProgress={handleProgress}
          startInLoadingState={false}
          userAgent={userAgent ?? defaultUA}
          applicationNameForUserAgent={APP_UA_SUFFIX}
          allowFileAccess={!highSecurity}
          allowUniversalAccessFromFileURLs={!highSecurity}
          mediaPlaybackRequiresUserAction={false}
          javaScriptCanOpenWindowsAutomatically={!highSecurity}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          keyboardDisplayRequiresUserAction={keyboardDisplayRequiresUserAction}
          hideKeyboardAccessoryView={hideKeyboardAccessoryView}
          pullToRefreshEnabled={enablePullToRefresh && Platform.OS === 'android'}
          setSupportMultipleWindows={false}
          // Intercept navigations (incl. target=_blank and external intents)
          onShouldStartLoadWithRequest={(req) => {
            const nextUrl = req?.url ?? '';

            // Security: Block javascript:, data:, and file: (file: blocked in high-security)
            if (/^(javascript:|data:)/i.test(nextUrl)) {
              return false;
            }
            if (highSecurity && /^file:\/\//i.test(nextUrl)) {
              return false;
            }
            // High-security: only allow HTTPS loads in the WebView (other schemes already handled above)
            if (highSecurity && !/^https:\/\//i.test(nextUrl)) {
              return false;
            }

            // External protocols: open in OS (consistent with telehealth / member expectations)
            if (
              /^(intent:|tel:|mailto:|sms:|smsto:|maps:|geo:|facetime:|facetime-audio:)/i.test(
                nextUrl,
              )
            ) {
              void Linking.openURL(nextUrl).catch(() => {
                RNLinking.openURL(nextUrl).catch(() => {});
              });
              return false;
            }

            if (shouldOpenExternally(nextUrl)) {
              openExternal(nextUrl);
              return false;
            }

            const host = urlToHost(nextUrl);
            const blockedDomains = ['phishing.com', 'malware.com'];
            if (blockedDomains.some((d) => host.includes(d))) {
              return false;
            }

            return true;
          }}
          // Avoid full-screen error for 4xx on subresources (APIs, beacons); many SPAs still render.
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const code = nativeEvent.statusCode ?? 0;
            if (code >= 500) {
              setHasError(true);
              return;
            }
            if (code === 404 || code === 403) {
              const failed = nativeEvent.url ?? '';
              try {
                const f = new URL(failed);
                const m = new URL(url);
                if (f.hostname === m.hostname && f.pathname === m.pathname) {
                  setHasError(true);
                }
              } catch {
                /* ignore */
              }
            }
          }}
          onContentProcessDidTerminate={
            Platform.OS === 'ios'
              ? () => {
                  if (!isMountedRef.current) return;
                  setHasError(false);
                  setIsLoading(true);
                  if (fadeInOnLoad) fadeAnim.setValue(0);
                  requestAnimationFrame(() => webViewRef.current?.reload());
                }
              : undefined
          }
          onRenderProcessGone={
            Platform.OS === 'android'
              ? () => {
                  if (!isMountedRef.current) return;
                  setHasError(false);
                  setIsLoading(true);
                  if (fadeInOnLoad) fadeAnim.setValue(0);
                  requestAnimationFrame(() => webViewRef.current?.reload());
                }
              : undefined
          }
          // iOS-only: content inset adjust for better fit
          contentInsetAdjustmentBehavior="automatic"
          {...androidWebViewExtraProps}
          overScrollMode="content"
          cacheEnabled={!highSecurity}
          cacheMode={highSecurity && Platform.OS === 'android' ? 'LOAD_NO_CACHE' : 'LOAD_DEFAULT'}
          incognito={!persistCookies}
        />
        </Animated.View>

        {isLoading ? (
          <LoadingIndicator
            variant="overlay"
            message={loadingMessage ?? 'Just a moment…'}
          />
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  containerDark: {
    backgroundColor: colors.background.paper,
  },
  webViewOuter: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background.default,
    opacity: 1,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: moderateScale(3),
    backgroundColor: colors.primary.main,
    zIndex: 1000,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  errorContainer: {
    flex: 1,
    padding: responsiveSize.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.md,
  },
  errorIconWrap: {
    marginBottom: responsiveSize.sm,
    opacity: 0.9,
  },
  errorTitle: {
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorTitleDark: {
    color: colors.text.primary,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: responsiveSize.lg,
  },
  errorTextDark: {
    color: colors.text.secondary,
  },
  errorActions: {
    flexDirection: 'row',
    gap: responsiveSize.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: responsiveSize.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  retryButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    backgroundColor: colors.gray[100],
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: MIN_TOUCH_TARGET,
  },
  openButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});
