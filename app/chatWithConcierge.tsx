import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  BackHandler,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { MessageSquare } from 'lucide-react-native';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import WebView from 'react-native-webview';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #fff;
    }
    #loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #666;
      font-size: 16px;
    }
    #error {
      display: none;
      padding: 20px;
      text-align: center;
      color: #d32f2f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading">
    <div>
      <div class="spinner"></div>
      <div>Loading chat...</div>
    </div>
  </div>
  <div id="error"></div>

  <script>
    window.$zoho = window.$zoho || {};
    $zoho.salesiq = $zoho.salesiq || { ready: function() {} };

    let loadTimeout;
    let widgetLoaded = false;

    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
    }

    function showError(msg) {
      hideLoading();
      const errorEl = document.getElementById('error');
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ERROR', message: msg }));
    }

    function openChat() {
      try {
        if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.floatwindow) {
          window.$zoho.salesiq.floatwindow.visible('show');
          hideLoading();
          widgetLoaded = true;
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'CHAT_STARTED' }));
          clearTimeout(loadTimeout);
        }
      } catch (e) {
        showError('Failed to open chat: ' + e.message);
      }
    }

    function waitForWidget() {
      let attempts = 0;
      const maxAttempts = 100;

      const checkWidget = setInterval(() => {
        attempts++;

        if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.floatwindow) {
          clearInterval(checkWidget);
          setTimeout(openChat, 500);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkWidget);
          if (!widgetLoaded) {
            showError('Chat widget failed to load. Please try again later.');
          }
        }
      }, 100);
    }

    loadTimeout = setTimeout(() => {
      if (!widgetLoaded) {
        showError('Chat widget took too long to load. Please check your connection and try again.');
      }
    }, 15000);

    const script = document.createElement('script');
    script.id = 'zsiqscript';
    script.src = 'https://salesiq.zohopublic.com/widget?wc=siq341f0a21deffa52db946003babb9a87b';
    script.defer = true;
    script.onload = function() {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'SCRIPT_LOADED' }));
      waitForWidget();
    };
    script.onerror = function() {
      showError('Failed to load chat script. Please check your internet connection.');
    };
    document.body.appendChild(script);
  </script>
</body>
</html>
`;

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isChatActive, setIsChatActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const confirmExit = useCallback(() => {
    if (isChatActive) {
      Alert.alert('End Chat', 'Are you sure you want to end this chat?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Chat', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [isChatActive, router]);

  // Android hardware back
  useEffect(() => {
    const handleBack = () => {
      if (isChatActive) {
        confirmExit();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [isChatActive, confirmExit]);

  const handleMessage = (e: any) => {
    const msg = e?.nativeEvent?.data;
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'CHAT_STARTED') {
        setIsChatActive(true);
        setIsLoading(false);
      } else if (parsed.type === 'CHAT_ENDED') {
        setIsChatActive(false);
      } else if (parsed.type === 'ERROR') {
        console.log('Chat widget error:', parsed.message);
        setLoadError(parsed.message);
        setIsLoading(false);
      } else if (parsed.type === 'SCRIPT_LOADED') {
        console.log('Chat script loaded successfully');
      }
    } catch (err) {
      console.log('WebView message:', msg);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={confirmExit} />
        <View style={styles.titleContainer}>
          <MessageSquare size={moderateScale(24)} color={colors.primary.main} />
          <View style={styles.titleTextContainer}>
            <SmartText variant="h3" style={styles.title} maxLines={1}>Chat with Concierge</SmartText>
            <SmartText variant="body2" style={styles.subtitle} maxLines={1}>We typically reply in a few minutes</SmartText>
          </View>
        </View>
      </Animated.View>

      <View style={styles.flex}>
        <View style={styles.webviewWrapper}>
          <WebView
            style={styles.webview}
            source={{
              html: htmlContent,
              baseUrl: 'https://salesiq.zohopublic.com'
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            keyboardDisplayRequiresUserAction={false}
            scrollEnabled={true}
            bounces={false}
            onMessage={handleMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              setLoadError('Failed to load chat');
              setIsLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error: ', nativeEvent);
            }}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={Platform.OS === 'android'}
            startInLoadingState={false}
          />

          {isLoading && (
            <Animated.View
              style={styles.splashOverlay}
              exiting={FadeOut.duration(400)}
            >
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <SmartText variant="body1" style={styles.loadingText}>
                Connecting to chat...
              </SmartText>
            </Animated.View>
          )}

          {loadError && !isLoading && (
            <View style={styles.errorOverlay}>
              <SmartText variant="h4" style={styles.errorTitle}>
                Unable to Load Chat
              </SmartText>
              <SmartText variant="body1" style={styles.errorMessage}>
                {loadError}
              </SmartText>
              <SmartText variant="body2" style={styles.errorHint}>
                Please check your internet connection and try again
              </SmartText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: responsiveSize.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...platformStyles.shadowSm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: responsiveSize.xs,
    flex: 1,
    minWidth: 0,
  },
  titleTextContainer: {
    marginLeft: responsiveSize.sm,
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  title: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  webview: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: responsiveSize.xl * 3,
    height: responsiveSize.xl * 3,
    marginBottom: responsiveSize.lg,
  },
  loadingText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    zIndex: 10,
  },
  errorTitle: {
    color: colors.status.error,
    marginBottom: responsiveSize.md,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: responsiveSize.sm,
  },
  errorHint: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
