import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  BackHandler,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius, shadows } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';
import { generateInjectionScript } from './telehealthWebViewInjection';
import { TelehealthWebViewProps, WebViewMessage } from './types';

export interface TelehealthWebViewRef {
  goBackInWebView: () => boolean;
  reload: () => void;
}

export const TelehealthWebView = forwardRef<TelehealthWebViewRef, TelehealthWebViewProps>(({
  url,
  memberId,
  initialUrl,
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  onNavigationStateChange,
  onFormStateChange,
  onFormSubmitSuccess,
  onSessionExpired,
  headers = {}
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasUnsavedData, setHasUnsavedData] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const canGoBackRef = useRef(false);
  const initialUrlRef = useRef(initialUrl || url);
  const freezeCountRef = useRef(0);
  const currentUrlRef = useRef(url);

  const ANDROID_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
  const IOS_SAFARI_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const userAgent = Platform.select({
    ios: IOS_SAFARI_UA,
    android: ANDROID_CHROME_UA,
    default: ANDROID_CHROME_UA
  });

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [hasUnsavedData]);

  const handleFormStateChange = useCallback((hasData: boolean) => {
    setHasUnsavedData(hasData);
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
          setHasUnsavedData(false);
          onFormSubmitSuccess?.();
          break;

        case 'freeze':
          console.warn('WebView freeze detected:', message.data);
          freezeCountRef.current += 1;

          if (freezeCountRef.current <= 3 && !isFrozen) {
            setIsFrozen(true);

            setTimeout(() => {
              if (webViewRef.current) {
                console.log('Attempting to recover from freeze...');
                webViewRef.current.reload();
              }

              setTimeout(() => {
                setIsFrozen(false);
                freezeCountRef.current = 0;
              }, 2000);
            }, 500);
          }
          break;

        case 'error':
          console.error('WebView error:', message.data);
          break;

        case 'consoleLog':
          if (message.data?.level === 'error') {
            // Filter out Google Maps duplicate API error as it's not critical
            if (!message.data.message.includes('Google Maps JavaScript API multiple times')) {
              console.error('WebView console error:', message.data.message);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, [handleFormStateChange, onFormSubmitSuccess]);

  const handleBackPress = (): boolean => {
    if (hasUnsavedData && Platform.OS === 'android') {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved form data. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              if (canGoBackRef.current && webViewRef.current) {
                webViewRef.current.goBack();
              }
            }
          }
        ]
      );
      return true;
    }

    if (canGoBackRef.current && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }

    return false;
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleLoadError = (error: any) => {
    setIsLoading(false);
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
    canGoBackRef.current = navState.canGoBack && !isAtHomePage(navState.url);
    currentUrlRef.current = navState.url;
    onNavigationStateChange?.(navState);
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
    reload: () => webViewRef.current?.reload()
  }));

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
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
      <WebView
        ref={webViewRef}
        source={{ uri: url, headers }}
        style={styles.webview}
        originWhitelist={['*']}
        injectedJavaScript={generateInjectionScript()}
        injectedJavaScriptBeforeContentLoaded={generateInjectionScript()}
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
        scalesPageToFit={true}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleLoadError}
        onNavigationStateChange={handleNavChange}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode === 401 || nativeEvent.statusCode === 403) {
            onSessionExpired?.();
          }
        }}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body2" style={styles.loadingText} maxLines={1}>
            Loading telehealth portal...
          </SmartText>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background.default
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    gap: responsiveSize.md
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: responsiveSize.sm
  },
  errorContainer: {
    flex: 1,
    padding: responsiveSize.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.md
  },
  errorTitle: {
    color: colors.text.primary,
    textAlign: 'center'
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.xl,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    marginTop: responsiveSize.md,
    ...shadows.md
  },
  retryButtonText: {
    color: colors.background.default,
    fontWeight: '600'
  }
});

TelehealthWebView.displayName = 'TelehealthWebView';
