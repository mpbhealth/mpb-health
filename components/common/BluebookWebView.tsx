import React, { useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import WebView from 'react-native-webview';
import { SmartText } from '@/components/common/SmartText';
import { borderRadius, colors } from '@/constants/theme';
import { responsiveSize, moderateScale, cardChromeShadow } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { RefreshCw, AlertCircle } from 'lucide-react-native';

type Props = { url: string; email?: string | null };

export default function BluebookWebView({ url, email }: Props) {
  const webRef = useRef<WebView>(null);
  const [status, setStatus] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const safeEmail = (email ?? '').trim().toLowerCase();
  const escapedEmail = safeEmail.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');

  const handleError = useCallback((e: any) => {
    console.error('[BluebookWebView] Error:', e?.nativeEvent);
    setHasError(true);
    setErrorMessage('Unable to load page');
    setStatus('');
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setStatus('');
    setTimeout(() => {
      webRef.current?.reload();
    }, 100);
  }, []);

  const modernUserAgent = Platform.select({
    android: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    default: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });

  const onMessage = useCallback((e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data || '{}');
      if (msg?.type === 'status') {
        switch (msg.step) {
          case 'sso-injected': setStatus('Setting things up…'); break;
          case 'clicked-access-code': setStatus('Opening access…'); break;
          case 'entered-access-code': setStatus('Verifying…'); break;
          case 'profile-submitted': setStatus('Signing in…'); break;
          case 'sso-complete': setStatus(''); break;
          default: break;
        }
      }
    } catch (err) {
      console.error('[BluebookWebView] Parse error:', err);
    }
  }, []);

  const injector = `
(function () {
  try {
    if (window.__MPB_SSO_IOS) return true;
    window.__MPB_SSO_IOS = true;

    // Spoof modern browser features to avoid "unsupported browser" warnings
    if (!window.chrome) {
      window.chrome = { runtime: {} };
    }

    // Override navigator properties for better compatibility
    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
    Object.defineProperty(navigator, 'platform', { get: () => 'iPhone' });

    // Add modern browser features
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class IntersectionObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    if (!window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    // Add viewport meta if missing
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.insertBefore(meta, document.head.firstChild);
    }

    const CFG = {
      code: 'MPB',
      last: 'MPB Concierge',
      email: '${escapedEmail}',
      dob: '01/01/1999'
    };

    const post = (t, d) => {
      try {
        window.ReactNativeWebView?.postMessage(JSON.stringify({type:t,...d}));
      } catch(_) {}
    };

    const click = (el) => {
      if (!el) return;
      el.scrollIntoView?.({block:'center'});
      // Dispatch real events so Angular/SPA handlers fire (divs don't have native click)
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    };

    const setVal = (el, v) => {
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    };

    let tries = 0;
    let hasSubmitted = false;
    const tick = () => {
      try {
        if (tries++ > 600) {
          clearInterval(window.__MPB_IV);
          post('status', {step:'sso-complete'});
          return;
        }

        // Check for successful login indicators first (higher priority)
        const search = document.querySelector('input[placeholder*="find doctors" i]');
        const mainContent = document.querySelector('.main-content, .dashboard, .search-container');
        const userMenu = document.querySelector('.user-menu, .profile-menu, [class*="user-dropdown"]');
        const providerGrid = document.querySelector('.provider-grid, .doctor-list, [class*="provider"]');

        // If we find any success indicators, we're done
        if (search || mainContent || userMenu || providerGrid) {
          post('status', {step:'sso-complete'});
          clearInterval(window.__MPB_IV);
          return;
        }

        // Check if we're already logged in but on a different page
        const isLoggedIn = !document.querySelector('#login-last-name') &&
                          !document.querySelector('a.button.access-code-button') &&
                          !document.querySelector('.access-code-container');

        if (isLoggedIn && hasSubmitted && tries > 10) {
          // We submitted the form and we're not on login pages anymore
          post('status', {step:'sso-complete'});
          clearInterval(window.__MPB_IV);
          return;
        }

        const onAccess = /\\/ui\\/signinpublic/i.test(location.pathname||'');

        const lastEl = document.getElementById('login-last-name') || document.querySelector('input[name*="last" i][name*="name" i]') || document.querySelector('input[placeholder*="last" i]');
        if (!onAccess && !lastEl) {
          const btn = document.querySelector('a.button.access-code-button[href="/ui/signinpublic"]') ||
                      document.querySelector('a[href*="signinpublic" i].button') ||
                      document.querySelector('.access-code-button');
          if (btn) {
            click(btn);
            post('status', {step:'clicked-access-code'});
          }
          return;
        }

        if (onAccess) {
          const inp = document.querySelector('.access-code-container input') || document.querySelector('input[placeholder*="access" i]') || document.querySelector('.access-code-container input[type="text"]');
          const next = document.querySelector('div.access-code-button') ||
                      Array.from(document.querySelectorAll('.access-code-button')).find(function (el) {
                        return /NEXT/i.test(el.textContent || '');
                      }) ||
                      document.querySelector('button[type="submit"]') ||
                      document.querySelector('.access-code-button');
          if (inp && next) {
            setVal(inp, CFG.code);
            setTimeout(function () { click(next); }, 100);
            post('status', {step:'entered-access-code'});
            return;
          }
        }

        const last = document.getElementById('login-last-name') || document.querySelector('input[name*="last" i][name*="name" i]') || document.querySelector('input[placeholder*="last" i]');
        const dob = document.getElementById('login-dob') || document.querySelector('input[name*="dob" i]') || document.querySelector('input[placeholder*="date" i][placeholder*="birth" i]');
        const mail = document.getElementById('login-mbr-supplied-email') || document.querySelector('input[name*="email" i]') || document.querySelector('input[type="email"]');
        const login = document.querySelector('a.button.green.login-command-button') || document.querySelector('button[type="submit"].green') || document.querySelector('a.button.green') || document.querySelector('button[type="submit"]');

        if (last && dob && mail && login && !hasSubmitted) {
          if (last.value !== CFG.last) setVal(last, CFG.last);
          if (dob.value !== CFG.dob) setVal(dob, CFG.dob);
          if (mail.value !== CFG.email) setVal(mail, CFG.email);
          if (last.value === CFG.last && dob.value === CFG.dob) {
            setTimeout(() => {
              click(login);
              hasSubmitted = true;
              post('status', {step:'profile-submitted'});
            }, 200);
          }
        }
      } catch(e) {
        console.error('Tick error:', e);
      }
    };

    clearInterval(window.__MPB_IV);
    window.__MPB_IV = setInterval(tick, 350);
    post('status', {step:'sso-injected'});

    // Start checking immediately
    tick();

    // Safety timeout to clear status after 30 seconds regardless
    setTimeout(() => {
      clearInterval(window.__MPB_IV);
      post('status', {step:'sso-complete'});
    }, 30000);
  } catch (e) {
    console.error('Injection error:', e);
  }
})();
true;
  `;

  return (
    <View style={screenChrome.container}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent={modernUserAgent}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptCanOpenWindowsAutomatically={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        injectedJavaScript={injector}
        onMessage={onMessage}
        onLoadEnd={() => {
          setTimeout(() => {
            try {
              webRef.current?.injectJavaScript(injector);
            } catch (e) {
              console.error('[BluebookWebView] Inject failed:', e);
            }
          }, 600);
        }}
        onError={handleError}
        onHttpError={handleError}
        onRenderProcessGone={Platform.OS === 'android' ? (e) => {
          console.error('[BluebookWebView] Process gone:', e?.nativeEvent);
          setHasError(true);
          setErrorMessage('WebView crashed');
        } : undefined}
      />

      {status ? (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <SmartText variant="body2" style={styles.statusText} maxLines={1}>{status}</SmartText>
          </View>
        </View>
      ) : null}

      {hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <AlertCircle size={moderateScale(48)} color={colors.status.error} />
            <SmartText variant="h3" style={styles.errorTitle} maxLines={1}>Unable to Load</SmartText>
            <SmartText variant="body1" style={styles.errorText} maxLines={2}>
              {errorMessage || 'The page could not be loaded. Please try again.'}
            </SmartText>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <RefreshCw size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.retryButtonText} maxLines={1}>Retry</SmartText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusOverlay: {
    position: 'absolute',
    top: responsiveSize.xl,
    left: responsiveSize.lg,
    right: responsiveSize.lg,
    alignItems: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    paddingVertical: responsiveSize.sm,
    paddingHorizontal: responsiveSize.md,
    borderRadius: borderRadius.lg,
    gap: responsiveSize.sm,
    ...cardChromeShadow,
  },
  statusText: {
    color: colors.text.secondary,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
  },
  errorCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: responsiveSize.xl,
    alignItems: 'center',
    gap: responsiveSize.md,
    maxWidth: moderateScale(400),
    width: '100%',
    ...cardChromeShadow,
  },
  errorTitle: {
    color: colors.text.primary,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: responsiveSize.md,
    paddingHorizontal: responsiveSize.xl,
    borderRadius: borderRadius.lg,
    gap: responsiveSize.sm,
  },
  retryButtonText: {
    color: colors.background.default,
  },
});
