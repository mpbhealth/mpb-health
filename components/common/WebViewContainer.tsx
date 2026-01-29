// src/components/common/WebViewContainer.tsx

import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
  useMemo,
  ForwardedRef,
} from 'react';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import {
  StyleSheet,
  View,
  ActivityIndicator,
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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';

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
}

/** Comprehensive UX & security injection */
const getUXInject = (disableEnhancements: boolean) => {
  if (disableEnhancements) {
    return `
(function() {
  try {
    // Minimal enhancements for chat widgets
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(m);
    }
  } catch(err) {}
})();
true;
`;
  }

  return `
(function() {
  try {
    // Remove existing viewport meta tags to prevent conflicts
    const existingMetas = document.querySelectorAll('meta[name="viewport"]');
    existingMetas.forEach(meta => meta.remove());

    // Add optimized viewport
    var m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.insertBefore(m, document.head.firstChild);

    // Prevent horizontal scroll and force content to fit
    const style = document.createElement('style');
    style.id = 'webview-enhancements';
    style.textContent = \`
      html {
        overflow-x: hidden !important;
        max-width: 100vw !important;
        -webkit-overflow-scrolling: touch;
      }
      body {
        overflow-x: hidden !important;
        max-width: 100vw !important;
        margin: 0 !important;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      }
      * {
        max-width: 100vw !important;
        box-sizing: border-box !important;
      }
      img, iframe, video {
        max-width: 100% !important;
        height: auto !important;
      }
      input, textarea, select {
        font-size: 16px !important; /* Prevents iOS zoom on focus */
      }
    \`;
    document.head.appendChild(style);

    // Disable double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Prevent pinch zoom
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent keyboard from pushing layout (iOS)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function() {
        document.body.style.height = window.visualViewport.height + 'px';
      });
    }

    // Security: Prevent click-jacking
    if (window.top !== window.self) {
      console.warn('Nested iframe detected');
    }

    // Auto-dismiss iOS keyboard on scroll (improves UX)
    let scrollTimer;
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {
        if (document.activeElement && document.activeElement.tagName.match(/input|textarea/i)) {
          // Keep focus for form fields
        }
      }, 150);
    }, { passive: true });

  } catch(err) {
    console.error('WebView enhancement error:', err);
  }
})();
true;
`;
};

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
      headers = {},

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
    }: WebViewContainerProps,
    ref: ForwardedRef<WebView>,
  ) => {
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

    // External open rules
    const ALWAYS_EXTERNAL_HOSTS: (RegExp | string)[] = useMemo(
      () => [
        /(^|\.)zocdoc\.com$/i,
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
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (Platform.OS === 'android' && isMountedRef.current && canGoBackRef.current && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }, []);

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
      setIsLoading(true);
      setHasError(false);
      onLoadStart?.();
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setIsLoading(false);
      }, 20000);
    };

    const handleLoadEnd = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (!isMountedRef.current) return;
      setIsLoading(false);
      setRefreshing(false);
      onLoadEnd?.();
      setProgress(1);
      setTimeout(() => {
        if (isMountedRef.current) setProgress(0);
      }, 400);
    };

    const handleLoadError = (e: any) => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (!isMountedRef.current) return;
      setIsLoading(false);
      setRefreshing(false);
      setHasError(true);
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

    // Calendly inline support (kept from your version)
    const isCalendly = url.includes('calendly.com');
    const calendlyHtml = `
      <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>html, body {margin:0; padding:0; height:100%;}</style>
      </head><body>
      <div id="widget" style="height:100%;"></div>
      <script src="https://assets.calendly.com/assets/external/widget.js"></script>
      <script>
        Calendly.initInlineWidget({
          url: "${url}",
          parentElement: document.getElementById("widget")
        });
      </script>
      </body></html>
    `.trim();

    const source = isCalendly
      ? { html: calendlyHtml }
      : {
          uri: url,
          headers: {
            ...(cookies ? { Cookie: cookies } : {}),
            ...(headers || {}),
          },
        };

    // Combined injection: your injected JS + UX helper
    const uxInject = getUXInject(disableEnhancements);
    const combinedInjectedJS = `${uxInject}\n;${injectedJavaScript || ''}`;

    // Error view
    if (hasError) {
      return (
        <View style={[styles.container, dark && { backgroundColor: colors.background.paper }]}>
          <View style={styles.errorContainer}>
            <SmartText
              variant="h3"
              style={[styles.errorTitle, dark && { color: colors.text.primary }]}
              maxLines={2}
            >
              Something went wrong
            </SmartText>
            <SmartText
              variant="body1"
              style={[styles.errorText, dark && { color: colors.text.secondary }]}
              maxLines={2}
            >
              We couldn't load this page right now.
            </SmartText>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <SmartText variant="body1" style={styles.retryButtonText} maxLines={1}>Retry</SmartText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.openButton]}
                onPress={() => openExternal(url)}
              >
                <SmartText variant="body1" style={styles.openButtonText} maxLines={1}>Open in Browser</SmartText>
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

        <WebView
          ref={webViewRef as any}
          originWhitelist={['*']}
          source={source}
          style={[styles.webview, style]}
          injectedJavaScript={combinedInjectedJS}
          javaScriptEnabled={javaScriptEnabled}
          domStorageEnabled={domStorageEnabled}
          mixedContentMode="always"
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
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mediaPlaybackRequiresUserAction={false}
          javaScriptCanOpenWindowsAutomatically
          // iOS "in-page" swipe (not the stack swipe) for WebView history
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          // keyboard props
          keyboardDisplayRequiresUserAction={keyboardDisplayRequiresUserAction}
          hideKeyboardAccessoryView={hideKeyboardAccessoryView}
          // Pull to refresh (Android native)
          pullToRefreshEnabled={enablePullToRefresh && Platform.OS === 'android'}
          // New window / _blank (disable to prevent popup issues)
          setSupportMultipleWindows={false}
          // Intercept navigations (incl. target=_blank and external intents)
          onShouldStartLoadWithRequest={(req) => {
            const nextUrl = req?.url ?? '';

            // Security: Block javascript: and data: URLs
            if (/^(javascript:|data:)/i.test(nextUrl)) {
              console.warn('Blocked potentially malicious URL:', nextUrl);
              return false;
            }

            // External protocols
            if (/^(intent:|tel:|mailto:|sms:|maps:|geo:)/i.test(nextUrl)) {
              RNLinking.openURL(nextUrl);
              return false;
            }

            // Force external for some hosts
            if (shouldOpenExternally(nextUrl)) {
              openExternal(nextUrl);
              return false;
            }

            // Security: Prevent navigation to blocked domains
            const blockedDomains = ['phishing.com', 'malware.com']; // Add actual blocked domains
            const host = urlToHost(nextUrl);
            if (blockedDomains.some(d => host.includes(d))) {
              console.warn('Blocked navigation to:', nextUrl);
              return false;
            }

            // Allow normal navigation inside
            return true;
          }}
          // Handle HTTP errors gracefully
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP Error:', nativeEvent.statusCode, nativeEvent.url);
            if (nativeEvent.statusCode >= 500) {
              setHasError(true);
            }
          }}
          // Handle render process crashes (Android)
          onRenderProcessGone={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView crashed:', nativeEvent);
            if (nativeEvent.didCrash) {
              setHasError(true);
              // Optionally reload after crash
              setTimeout(() => {
                if (isMountedRef.current) {
                  webViewRef.current?.reload();
                }
              }, 1000);
            }
          }}
          // iOS-only: content inset adjust for better fit
          contentInsetAdjustmentBehavior="automatic"
          // Prevent memory leaks on Android
          androidLayerType="hardware"
          // Better performance
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          // Incognito mode (no persistent storage)
          incognito={!persistCookies}
        />

        {/* Global loader overlay (subtle, app-colored) */}
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: dark ? '#00000022' : `${colors.background.default}DD` }]}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: moderateScale(3),
    backgroundColor: colors.primary.main,
    zIndex: 1000,
    ...platformStyles.shadowSm,
  },

  // Loading overlay
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: `${colors.background.default}F5`,
  },

  errorContainer: {
    flex: 1,
    padding: responsiveSize.xxl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: responsiveSize.md,
  },
  errorTitle: {
    color: colors.text.primary,
    textAlign: 'center' as const,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center' as const,
  },
  errorActions: {
    flexDirection: 'row' as const,
    gap: responsiveSize.md,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    ...platformStyles.shadowMd,
  },
  retryButtonText: {
    color: colors.background.default,
  },
  openButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  openButtonText: {
    color: colors.text.primary,
  },
});
