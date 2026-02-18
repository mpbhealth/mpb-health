/**
 * WebView for Multiplan Claritev Provider Search (https://providersearch.multiplan.com/).
 * Waits for the page/SPA to load, auto-selects "PHCS Specific Services" radio, then clicks "Select and Search".
 * Re-injects script after load so it runs once MUI/React has rendered.
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import WebView from 'react-native-webview';
import { colors } from '@/constants/theme';

const MULTIPLAN_PROVIDER_SEARCH_ORIGIN = 'https://providersearch.multiplan.com';

/**
 * Script runs in the page. Each re-injection gets a fresh run (no __MPB_ProviderSearchDone guard at start).
 * Uses native setter so React/MUI state updates; then clicks the button.
 */
function getAutoSelectScript(): string {
  return `
(function() {
  if (window.__MPB_ProviderSearchDone === true) return true;
  function run() {
    try {
      var radio = document.getElementById('phcs-PHCS Specific Services') ||
                  document.querySelector('input[value="PHCS Specific Services"]') ||
                  document.querySelector('input[aria-label="PHCS Specific Services"]') ||
                  document.querySelector('input.PrivateSwitchBase-input[value="PHCS Specific Services"]') ||
                  document.querySelector('input[type="radio"][id^="phcs-"]');
      var btn = document.querySelector('button[data-testid="select-and-search"]') ||
                Array.from(document.querySelectorAll('button')).find(function(b) {
                  return (b.textContent || '').indexOf('Select and Search') >= 0;
                });
      if (!radio || !btn) return false;

      if (!radio.checked) {
        radio.focus();
        try {
          var proto = (window.HTMLInputElement && HTMLInputElement.prototype) || (radio.constructor && radio.constructor.prototype);
          if (proto) {
            var desc = Object.getOwnPropertyDescriptor(proto, 'checked');
            if (desc && desc.set) {
              desc.set.call(radio, true);
            } else {
              radio.checked = true;
            }
          } else {
            radio.checked = true;
          }
        } catch (_) {
          radio.checked = true;
        }
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        radio.dispatchEvent(new Event('input', { bubbles: true }));
        radio.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        var label = document.querySelector('label[for="phcs-PHCS Specific Services"]');
        if (label) {
          label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      }
      if (btn.disabled) return false;
      setTimeout(function() {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        window.__MPB_ProviderSearchDone = true;
      }, 250);
      return true;
    } catch (e) {
      console.warn('ProviderSearch auto-select:', e);
      return false;
    }
  }
  var attempts = 0;
  var maxAttempts = 50;
  function tick() {
    attempts++;
    if (run() || attempts >= maxAttempts) return;
    setTimeout(tick, 400);
  }
  setTimeout(tick, 600);
})();
true;
`;
}

export interface ProviderSearchWebViewProps {
  url: string;
}

const REINJECT_DELAYS_MS = [2000, 4500, 7000];

export function ProviderSearchWebView({ url }: ProviderSearchWebViewProps) {
  const webRef = useRef<WebView>(null);
  const reinjectTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const injectScript = useCallback(() => {
    const script = getAutoSelectScript();
    try {
      webRef.current?.injectJavaScript(script);
    } catch (e) {
      console.warn('[ProviderSearchWebView] inject failed', e);
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    reinjectTimeouts.current.forEach((t) => clearTimeout(t));
    reinjectTimeouts.current = [];
    REINJECT_DELAYS_MS.forEach((delay, i) => {
      const t = setTimeout(() => {
        injectScript();
      }, delay);
      reinjectTimeouts.current.push(t);
    });
  }, [injectScript]);

  React.useEffect(() => {
    return () => {
      reinjectTimeouts.current.forEach((t) => clearTimeout(t));
      reinjectTimeouts.current = [];
    };
  }, []);

  const script = getAutoSelectScript();
  const defaultUA = Platform.select({
    android: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    default: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  });

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        mixedContentMode="always"
        userAgent={defaultUA}
        originWhitelist={['*']}
        injectedJavaScript={script}
        onLoadEnd={handleLoadEnd}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
      />
    </View>
  );
}

/** Returns true if the URL is the Multiplan provider search (Claritev) so we use ProviderSearchWebView */
export function isMultiplanProviderSearchUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    return u.origin === MULTIPLAN_PROVIDER_SEARCH_ORIGIN;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
});
