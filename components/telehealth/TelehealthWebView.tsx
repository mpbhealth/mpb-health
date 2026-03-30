import React, { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmartText } from '@/components/common/SmartText';
import { buildWebViewInjectionScript } from '@/components/common/WebViewContainer';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';
import { buildTelehealthBridgeScript } from './telehealthWebViewInjection';
import { TelehealthWebViewProps, WebViewMessage } from './types';
import { TelehealthLoadingPanel } from './TelehealthLoadingPanel';
import { TELEHEALTH_LOADING } from './telehealthLoadingCopy';

export interface TelehealthWebViewRef {
  goBackInWebView: () => boolean;
  reload: () => void;
}

export const TelehealthWebView = forwardRef<TelehealthWebViewRef, TelehealthWebViewProps>(({
  url,
  memberId: _memberId,
  initialUrl,
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  onNavigationStateChange,
  onFormStateChange,
  onFormSubmitSuccess,
  onSessionExpired,
  headers = {},
  loadingSubtitle,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  /** Full card overlay only until the first page finishes loading. */
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);
  /** 0 = hidden; otherwise thin top bar while navigating inside the portal */
  const [navProgress, setNavProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  const canGoBackRef = useRef(false);
  const initialUrlRef = useRef(initialUrl || url);
  const freezeCountRef = useRef(0);
  const isRecoveringFromFreezeRef = useRef(false);
  const currentUrlRef = useRef(url);
  const initialLoadFinishedRef = useRef(false);

  const injectedScript = useMemo(() => {
    const portal = buildWebViewInjectionScript('portal', {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    });
    return `${portal}\n${buildTelehealthBridgeScript()}`;
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  const ANDROID_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
  const IOS_SAFARI_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const userAgent = Platform.select({
    ios: IOS_SAFARI_UA,
    android: ANDROID_CHROME_UA,
    default: ANDROID_CHROME_UA,
  });

  const webSubtitle = loadingSubtitle ?? TELEHEALTH_LOADING.subtitleWebView;

  useEffect(() => {
    initialUrlRef.current = initialUrl || url;
    currentUrlRef.current = url;
  }, [url, initialUrl]);

  const handleFormStateChange = useCallback((hasData: boolean) => {
    onFormStateChange?.(hasData);
  }, [onFormStateChange]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'formStateChange':
          if (message.data?.hasData !== undefined) {
            handleFormStateChange(message.data.hasData);
          }
          break;

        case 'formSubmit':
          onFormStateChange?.(false);
          onFormSubmitSuccess?.();
          break;

        case 'freeze':
          console.warn('WebView freeze detected:', message.data);
          freezeCountRef.current += 1;

          if (freezeCountRef.current <= 3 && !isRecoveringFromFreezeRef.current) {
            isRecoveringFromFreezeRef.current = true;

            setTimeout(() => {
              if (webViewRef.current) {
                console.log('Attempting to recover from freeze...');
                webViewRef.current.reload();
              }

              setTimeout(() => {
                isRecoveringFromFreezeRef.current = false;
                freezeCountRef.current = 0;
              }, 2000);
            }, 500);
          }
          break;

        case 'error':
          console.error('WebView error:', message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, [handleFormStateChange, onFormSubmitSuccess, onFormStateChange]);

  const handleLoadStart = () => {
    setHasError(false);
    if (!initialLoadFinishedRef.current) {
      setShowInitialOverlay(true);
    } else {
      setNavProgress(0.08);
    }
    onLoadStart?.();
  };

  const handleLoadProgress = (e: { nativeEvent: { progress: number } }) => {
    if (initialLoadFinishedRef.current) {
      const p = e?.nativeEvent?.progress ?? 0;
      setNavProgress(Math.max(0.08, p));
    }
  };

  const handleLoadEnd = () => {
    initialLoadFinishedRef.current = true;
    setShowInitialOverlay(false);
    setNavProgress(0);
    onLoadEnd?.();
  };

  const handleLoadError = (error: any) => {
    setShowInitialOverlay(false);
    setNavProgress(0);
    setHasError(true);
    onError?.(error);
  };

  const isAtHomePage = (currentUrl: string): boolean => {
    if (!initialUrlRef.current) return false;

    try {
      const initial = new URL(initialUrlRef.current);
      const current = new URL(currentUrl);

      return (
        initial.origin === current.origin &&
        (current.pathname === initial.pathname ||
          current.pathname === '/' ||
          current.pathname.includes('/home') ||
          current.pathname.includes('/mpbh/home'))
      );
    } catch {
      return false;
    }
  };

  const handleNavChange = (navState: WebViewNavigation) => {
    const atHome = isAtHomePage(navState.url);
    const effectiveCanGoBack = Boolean(navState.canGoBack && !atHome);
    canGoBackRef.current = effectiveCanGoBack;
    currentUrlRef.current = navState.url;
    onNavigationStateChange?.({
      ...navState,
      canGoBack: effectiveCanGoBack,
    });
  };

  const goBackInWebView = () => {
    if (canGoBackRef.current && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  useImperativeHandle(ref, () => ({
    goBackInWebView,
    reload: () => webViewRef.current?.reload(),
  }));

  const handleRetry = () => {
    setHasError(false);
    initialLoadFinishedRef.current = false;
    setShowInitialOverlay(true);
    webViewRef.current?.reload();
  };

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <SmartText variant="h3" style={styles.errorTitle} maxLines={2}>
            Connection Error
          </SmartText>
          <SmartText variant="body1" style={styles.errorText} maxLines={3}>
            Unable to load the telehealth portal. Please check your connection and try again.
          </SmartText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <SmartText variant="body1" style={styles.retryButtonText} maxLines={1}>
              Retry
            </SmartText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {navProgress > 0 && (
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${Math.min(100, navProgress * 100)}%` }]} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: url, headers }}
        style={styles.webview}
        originWhitelist={['*']}
        injectedJavaScript={injectedScript}
        injectedJavaScriptBeforeContentLoaded={injectedScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        mixedContentMode="always"
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        scrollEnabled={true}
        bounces={true}
        userAgent={userAgent}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView={false}
        allowsInlineMediaPlayback={true}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior="automatic"
        pullToRefreshEnabled={false}
        androidLayerType="hardware"
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleLoadError}
        onNavigationStateChange={handleNavChange}
        onShouldStartLoadWithRequest={(request) => {
          const u = (request.url || '').trim().toLowerCase();
          if (u.startsWith('javascript:')) return false;
          if (u.startsWith('file:')) return false;
          return true;
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode === 401 || nativeEvent.statusCode === 403) {
            onSessionExpired?.();
          }
        }}
      />

      {showInitialOverlay && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingScrim} pointerEvents="none" />
          <View style={styles.loadingPanelWrap}>
            <TelehealthLoadingPanel
              variant="card"
              elevated
              title={TELEHEALTH_LOADING.title}
              subtitle={webSubtitle}
              compact
            />
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(3),
    backgroundColor: colors.gray[100],
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: moderateScale(2),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.xl,
    zIndex: 5,
  },
  loadingScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
  },
  loadingPanelWrap: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    padding: responsiveSize.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.md,
  },
  errorTitle: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.xl,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    marginTop: responsiveSize.md,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  retryButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },
});

TelehealthWebView.displayName = 'TelehealthWebView';
