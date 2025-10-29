// src/screens/ChatScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MessageSquare } from 'lucide-react-native';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';

const injectedJavaScript = `
  (function() {
    function clickChatWidget() {
      const selectors = [
        '#zsiq_float',
        '.chat-widget-button',
        '.chat-launcher',
        '#chat-widget-container button',
        '[aria-label*="chat" i]',
        '[title*="chat" i]',
        'div[style*="position: fixed"][style*="bottom"][style*="right"] button',
        'div[style*="position: fixed"][style*="bottom"][style*="right"]',
        'iframe[title*="chat" i]',
        'button[style*="position: fixed"][style*="bottom"][style*="right"]'
      ];
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const rc = el.getBoundingClientRect();
          if (
            rc.width > 0 &&
            rc.height > 0 &&
            window.getComputedStyle(el).display !== 'none' &&
            window.getComputedStyle(el).visibility !== 'hidden'
          ) {
            el.click();
            window.ReactNativeWebView?.postMessage('CHAT_STARTED');
            return;
          }
        }
      }
      const iframes = document.getElementsByTagName('iframe');
      for (const iframe of iframes) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          for (const sel of selectors) {
            const els = doc.querySelectorAll(sel);
            for (const el of els) {
              if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                el.click();
                window.ReactNativeWebView?.postMessage('CHAT_STARTED');
                return;
              }
            }
          }
        } catch {}
      }
    }

    function waitForElement(selector) {
      return new Promise(resolve => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        const obs = new MutationObserver(() => {
          const found = document.querySelector(selector);
          if (found) {
            obs.disconnect();
            resolve(found);
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }

    async function start() {
      const widget = await waitForElement('#zsiq_float');
      if (widget) {
        setTimeout(() => {
          try { widget.click(); } catch(e) { try { clickChatWidget(); } catch(_) {} }
          window.ReactNativeWebView?.postMessage('CHAT_STARTED');
        }, 1500);
      } else {
        setTimeout(clickChatWidget, 2000);
      }
    }

    start();

    window.onbeforeunload = () => false;
    document.addEventListener('click', e => {
      const t = e.target;
      if (t && t.tagName === 'A') {
        e.preventDefault();
        return false;
      }
    }, true);
  })();
`;

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isChatActive, setIsChatActive] = useState(false);

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
    if (msg === 'CHAT_STARTED') setIsChatActive(true);
    if (msg === 'CHAT_ENDED') setIsChatActive(false);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={confirmExit} />
        <View style={styles.titleContainer}>
          <MessageSquare size={24} color="#0891b2" />
          <View style={styles.titleTextContainer}>
            <Text style={styles.title}>Chat with Concierge</Text>
            <Text style={styles.subtitle}>We typically reply in a few minutes</Text>
          </View>
        </View>
      </Animated.View>

      {/* No KeyboardAvoidingView — the input lives inside the WebView */}
      <View style={[styles.webviewWrapper, { paddingBottom: Math.max(insets.bottom, 0) }]}>
        <WebViewContainer
          style={styles.webview}
          url="https://chat.mpb.health"
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled
          domStorageEnabled
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={true}
          scrollEnabled
          bounces={false}
          onMessage={handleMessage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      ios: { paddingTop: 60, paddingBottom: 16 },
      android: { paddingTop: 40, paddingBottom: 16 },
      web: { paddingTop: 16, paddingBottom: 16 },
    }),
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  titleTextContainer: { marginLeft: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  webviewWrapper: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
});
