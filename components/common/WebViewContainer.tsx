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
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Linking as RNLinking,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

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
}

/** Tiny UX injection to make sites feel snappier in-app */
const UX_INJECT = `
(function() {
  try {
    // Avoid double-adding meta
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
      document.head.appendChild(m);
    }
    // Improve tap responsiveness on older libs
    document.body.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
    // Smooth-ish scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
  } catch(_) {}
})();
true; // required on iOS
`;

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

    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // Save/load simple cookies string (if you set it somewhere else)
    useEffect(() => {
      AsyncStorage.getItem('webview_cookies').then((stored) => {
        if (stored) setCookies(stored);
      });
    }, []);

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
    const combinedInjectedJS = `${UX_INJECT}\n;${injectedJavaScript || ''}`;

    // Error view
    if (hasError) {
      return (
        <View style={[styles.container, dark && { backgroundColor: colors.background.paper }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, dark && { color: colors.text.primary }]}>
              Something went wrong
            </Text>
            <Text style={[styles.errorText, dark && { color: colors.text.secondary }]}>
              We couldn’t load this page right now.
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.openButton]}
                onPress={() => openExternal(url)}
              >
                <Text style={styles.openButtonText}>Open in Browser</Text>
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
          // iOS "in-page" swipe (not the stack swipe) for WebView history
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          // keyboard props
          keyboardDisplayRequiresUserAction={keyboardDisplayRequiresUserAction}
          hideKeyboardAccessoryView={hideKeyboardAccessoryView}
          // Pull to refresh (Android native)
          pullToRefreshEnabled={enablePullToRefresh && Platform.OS === 'android'}
          // New window / _blank
          setSupportMultipleWindows
          onOpenWindow={async (e) => {
            const targetUrl = e?.nativeEvent?.targetUrl;
            if (!targetUrl) return;
            // Prefer opening external for new windows to keep app context clean
            await openExternal(targetUrl);
          }}
          // Intercept navigations (incl. target=_blank and external intents)
          onShouldStartLoadWithRequest={(req) => {
            const nextUrl = req?.url ?? '';
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
            // Allow normal navigation inside
            return true;
          }}
          // iOS-only: content inset adjust for better fit
          contentInsetAdjustmentBehavior="automatic"
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
    height: 3,
    backgroundColor: colors.primary.main,
    zIndex: 1000,
    ...shadows.sm,
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

  // Error state
  errorContainer: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  errorTitle: {
    ...typography.h3,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center' as const,
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.background.default,
    ...typography.body1,
    fontWeight: '700' as const,
  },
  openButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  openButtonText: {
    color: colors.text.primary,
    ...typography.body1,
    fontWeight: '600' as const,
  },
});
