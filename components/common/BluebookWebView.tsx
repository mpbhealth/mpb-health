import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { spacing, borderRadius, colors, shadows, typography } from '@/constants/theme';

type Props = { url: string; email?: string | null };

export default function BluebookWebView({ url, email }: Props) {
  const webRef = useRef<WebView>(null);
  const [status, setStatus] = useState('Setting things up…');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CONFIG = {
    ACCESS_CODE: 'MPB',
    LAST_NAME: 'MPB Concierge',
    DOB_MMDDYYYY: '01/01/1999',
    STEP2_FREEZE_MS: 3000,
    STEP2_FAIL_RETRY_MS: 6000,
    MAX_STEP2_RETRIES: 2,
    WATCH_WARN_MS: 10000,
    WATCH_RELOAD_MS: 45000,
  };

  const userAgent = useMemo(() => {
    const iosSafari =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const androidChrome =
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
    return Platform.OS === 'ios' ? iosSafari : androidChrome;
  }, []);

  const safeEmail = (email ?? '').trim().toLowerCase();

  const prePing = `
    (function(){
      try {
        if (!window.ReactNativeWebView) return true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'debug', note:'pre-ping-before ' + (location.href||'') }));
      } catch(_) {}
      true;
    })();
  `;

  const injector = useMemo(() => {
    const payload = JSON.stringify({
      accessCode: CONFIG.ACCESS_CODE,
      lastName: CONFIG.LAST_NAME,
      email: safeEmail,
      dob: CONFIG.DOB_MMDDYYYY,
      step2FreezeMs: CONFIG.STEP2_FREEZE_MS,
      step2FailRetryMs: CONFIG.STEP2_FAIL_RETRY_MS,
      maxStep2Retries: CONFIG.MAX_STEP2_RETRIES,
      watchWarnMs: CONFIG.WATCH_WARN_MS,
      watchReloadMs: CONFIG.WATCH_RELOAD_MS,
      buildTag: 'mpb-sso-v8',
    });

    return `
(function () {
  try {
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'debug', note:'pre-ping-after ' + (location.href||'') })); } catch(_) {}

    if (window.__MPB_SSO && window.__MPB_SSO.buildTag === 'mpb-sso-v8') {
      window.__MPB_SSO_BOOT && window.__MPB_SSO_BOOT();
      return true;
    }

    (function(){
      try {
        const orig = { log:console.log, info:console.info, warn:console.warn, error:console.error };
        const fwd = (tag,args) => {
          const msg = Array.from(args).map(x => {
            if (typeof x === 'string') return x;
            try { return JSON.stringify(x); } catch { return String(x); }
          }).join(' ');
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'debug', note:\`[PAGE \${tag}] \${msg}\` }));
        };
        console.log   = function(){ fwd('LOG', arguments);   return orig.log.apply(console, arguments); };
        console.info  = function(){ fwd('INFO', arguments);  return orig.info.apply(console, arguments); };
        console.warn  = function(){ fwd('WARN', arguments);  return orig.warn.apply(console, arguments); };
        console.error = function(){ fwd('ERR', arguments);   return orig.error.apply(console, arguments); };
        console.log('[MPB SSO] console bridge active');
      } catch(_) {}
    })();

    window.__MPB_SSO = {
      buildTag: 'mpb-sso-v8',
      config: ${payload},
      step1Opened: false,
      step2Submitting: false,
      step2SubmittedAt: 0,
      step2Retries: 0,
      step3Submitted: false,
      lastProgressAt: Date.now(),
      done: false,
      tries: 0,
      postedInjected: false,
    };
    const S = window.__MPB_SSO;

    const post = (type, payload) => { try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload })); } catch(_) {} };
    const log = (m) => { try { console.log('[MPB SSO]', new Date().toLocaleTimeString(), m); } catch(_) {} post('debug', { note: m }); };
    const progress = (step, note) => { S.lastProgressAt = Date.now(); if (!S.postedInjected && step==='sso-injected'){ S.postedInjected = true; } log(\`✔ \${step}\${note?(' – '+note):''}\`); post('status', { step }); };
    const warn = (m) => log('⚠ ' + m);
    const err  = (m) => log('❌ ' + m);

    const visible = n => !!n && (()=>{ const cs=getComputedStyle(n); return cs.display!=='none' && cs.visibility!=='hidden' && +cs.opacity!==0 && (n.offsetWidth||n.offsetHeight||n.getClientRects().length); })();
    const click = (el) => { if (!el) return false; try { el.removeAttribute('disabled'); el.removeAttribute('aria-disabled'); } catch(_){} el.scrollIntoView?.({block:'center'}); el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true})); el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true})); el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); return true; };
    const setVal = (el, v) => {
      if (!el) return;
      const desc = Object.getOwnPropertyDescriptor(el,'value');
      const proto= Object.getPrototypeOf(el);
      const pset = Object.getOwnPropertyDescriptor(proto||{},'value');
      const setter = (pset&&pset.set) || (desc&&desc.set);
      el.focus?.();
      if (setter) setter.call(el, v); else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles:true }));
      el.dispatchEvent(new Event('change',{ bubbles:true }));
      el.blur?.();
    };

    const onAccessPage = () => /\\/ui\\/signinpublic\\b/i.test(location.pathname || '');

    const findStep1Trigger = () =>
      document.querySelector('a.button.access-code-button[href="/ui/signinpublic"]') ||
      Array.from(document.querySelectorAll('a,button,[role="button"]')).find(n => visible(n) && /log\\s*in\\s*with\\s*access\\s*code/i.test(n.textContent||''));

    const step2Els = () => {
      const container = document.querySelector('.access-code-container');
      const input = container && (container.querySelector('input.access-code-box') || container.querySelector('input[type="text"]'));
      const nextA = container && container.querySelector('a[href^="javascript"]');
      const nextDiv = container && container.querySelector('.access-code-button');
      const nextEl = nextA || nextDiv;
      const heading = Array.from(document.querySelectorAll('p.access-code, .access-code'))
        .find(p => visible(p) && /enter\\s*your\\s*bluebook\\s*access\\s*code/i.test((p.textContent||'').toLowerCase()));
      return { container, input, nextEl, heading };
    };

    const step3Els = () => {
      const last = document.getElementById('login-last-name');
      const dob  = document.getElementById('login-dob');
      const mail = document.getElementById('login-mbr-supplied-email');
      const loginBtn = document.querySelector('a.button.green.login-command-button.sign-in-button');
      return { last, dob, mail, loginBtn };
    };

    function step1() {
      if (S.step1Opened) return;
      if (onAccessPage()) { S.step1Opened = true; progress('sso-injected', 'already on /ui/signinpublic'); progress('clicked-access-code', 'already on /ui/signinpublic'); return; }
      const t = findStep1Trigger();
      if (!t) return log('Step1: trigger not present yet');
      if (click(t)) { S.step1Opened = true; progress('clicked-access-code'); }
    }

    function safeSubmitOnce(nextEl) {
      const now = Date.now();
      if (S.step2Submitting && (now - S.step2SubmittedAt) < S.config.step2FreezeMs) {
        return log('Step2: frozen to avoid double-submit');
      }
      S.step2Submitting = true;
      S.step2SubmittedAt = now;
      click(nextEl);
    }

    function step2() {
      if (!onAccessPage()) return log('Step2: not on /ui/signinpublic yet; waiting');
      const { container, input, nextEl, heading } = step2Els();

      if (!(container && input && nextEl)) return log('Step2: access UI not fully ready (container/input/button missing)');

      if (!heading) {
        return log('Step2: heading not present yet');
      }

      setVal(input, S.config.accessCode);
      log('Step2: typing access code and pressing NEXT');
      safeSubmitOnce(nextEl);
    }

    function step2ProgressWatcher() {
      const { last, dob, mail } = step3Els();
      const hasProfile = !!(last || dob || mail);
      const stillOnStep2 = onAccessPage();

      if (hasProfile) {
        progress('entered-access-code', 'profile screen appeared');
        return;
      }

      if (S.step2Submitting && stillOnStep2) {
        const since = Date.now() - S.step2SubmittedAt;
        if (since > S.config.step2FailRetryMs && S.step2Retries < S.config.maxStep2Retries) {
          S.step2Retries++;
          S.step2Submitting = false;
          log('Step2: still on access screen; retrying submit (retry #' + S.step2Retries + ')');
          const { input, nextEl } = step2Els();
          if (input) setVal(input, S.config.accessCode);
          if (nextEl) safeSubmitOnce(nextEl);
        }
      }
    }

    function step3() {
      if (S.step3Submitted) return;
      const { last, dob, mail, loginBtn } = step3Els();
      if (!(last && dob && mail && loginBtn && visible(loginBtn))) return log('Step3: markers not ready');

      const same = (a,b) => (a||'').trim() === (b||'').trim();
      if (!same(last.value, S.config.lastName)) setVal(last, S.config.lastName);
      if (!same(dob.value,  S.config.dob))      setVal(dob,  S.config.dob);
      if (!same(mail.value, S.config.email||''))setVal(mail, S.config.email||'');

      if (!same(last.value, S.config.lastName) || !same(dob.value, S.config.dob) || !same(mail.value, S.config.email||'')) {
        return log('Step3: waiting for values to stick…');
      }

      log('Step3: submitting "Log in"');
      click(loginBtn);
      S.step3Submitted = true;
      progress('profile-submitted');
    }

    function detectHome() {
      const search = document.querySelector('input[placeholder*="find doctors" i], input[aria-label*="find doctors" i]');
      if (search && !S.done) { S.done = true; progress('sso-complete'); }
    }

    function watchdog() {
      const since = Date.now() - S.lastProgressAt;
      if (since > S.config.watchWarnMs && since < S.config.watchReloadMs) {
        warn('No progress for ' + since + 'ms');
      } else if (since >= S.config.watchReloadMs) {
        err('Reloading page after stall ' + since + 'ms');
        try { location.reload(); } catch(_){}
        S.lastProgressAt = Date.now();
      }
    }

    function tick(){
      try {
        step1();
        step2();
        step2ProgressWatcher();
        step3();
        detectHome();
        watchdog();
        S.tries++;
        if (S.done || S.tries > 2400) {
          console.log(S.done ? 'Flow complete' : 'Giving up (timeout)');
          clearInterval(S.__interval);
          post('status', { step: S.done ? 'sso-complete' : 'sso-timeout' });
        }
      } catch(e){ err('tick error: ' + e); }
    }

    window.__MPB_SSO_BOOT = function(){
      clearInterval(S.__interval);
      S.__interval = setInterval(tick, 350);
      log('Injector ready @ ' + (location.href||''));
      progress('sso-injected');
      tick();
    };

    window.__MPB_SSO_BOOT();

  } catch (e) {
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'status', step:'inject-error', detail:String(e) })); } catch(_) {}
  }
})();
true;
    `;
  }, [safeEmail, CONFIG.ACCESS_CODE, CONFIG.LAST_NAME, CONFIG.DOB_MMDDYYYY, CONFIG.STEP2_FREEZE_MS, CONFIG.STEP2_FAIL_RETRY_MS, CONFIG.MAX_STEP2_RETRIES, CONFIG.WATCH_WARN_MS, CONFIG.WATCH_RELOAD_MS]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data || '{}');
      if (msg?.type === 'status') {
        if (__DEV__) console.log('[MPB SSO STATUS]', msg.step);
        switch (msg.step) {
          case 'sso-injected': setStatus('Setting things up…'); setHasError(false); break;
          case 'clicked-access-code': setStatus('Opening access code…'); break;
          case 'entered-access-code': setStatus('Verifying access…'); break;
          case 'profile-submitted': setStatus('Signing you in…'); break;
          case 'sso-complete': setStatus(''); break;
          case 'sso-timeout': setStatus("We couldn't finish automatic sign-in. You can continue manually."); setHasError(true); break;
          case 'inject-error': setStatus('Could not prepare automatic sign-in.'); setHasError(true); break;
          default: break;
        }
      } else if (msg?.type === 'debug') {
        if (__DEV__) console.log('[MPB SSO DEBUG]', msg.note);
      } else {
        if (__DEV__) console.log('[MPB SSO RAW]', msg);
      }
    } catch (err) {
      if (__DEV__) console.error('[MPB SSO onMessage parse error]', err);
    }
  }, []);

  const reinject = useCallback(() => {
    try {
      webRef.current?.injectJavaScript(injector);
    } catch (err) {
      if (__DEV__) console.error('[MPB SSO] Reinject failed:', err);
    }
  }, [injector]);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    if (__DEV__) console.log('[MPB SSO RN] onNavChange →', nav.url);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(reinject, 150);
  }, [reinject]);

  const handleError = useCallback((e: any) => {
    if (__DEV__) console.error('[MPB SSO RN] onError', e.nativeEvent);
    setHasError(true);
    setErrorMessage('Network error loading page');
    setStatus('');
  }, []);

  const handleHttpError = useCallback((e: any) => {
    if (__DEV__) console.error('[MPB SSO RN] onHttpError', e.nativeEvent);
    setHasError(true);
    setErrorMessage('HTTP error loading page');
    setStatus('');
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setStatus('Setting things up…');
    webRef.current?.reload();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        userAgent={userAgent}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptCanOpenWindowsAutomatically
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback

        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
        injectedJavaScriptForMainFrameOnly={false}

        injectedJavaScriptBeforeContentLoaded={prePing}
        injectedJavaScript={injector}

        onMessage={onMessage}
        onLoadStart={() => { if (__DEV__) console.log('[MPB SSO RN] WebView load start'); }}
        onLoadEnd={() => { if (__DEV__) console.log('[MPB SSO RN] WebView load end'); reinject(); }}
        onLoadProgress={({ nativeEvent }) => { if (__DEV__) console.log('[MPB SSO RN] progress', nativeEvent.progress); }}
        onNavigationStateChange={onNavChange}
        onError={handleError}
        onHttpError={handleHttpError}

        dataDetectorTypes="none"
        onShouldStartLoadWithRequest={(req) => { if (__DEV__) console.log('[MPB SSO RN] request', req.url); return true; }}
        mixedContentMode="always"
      />
      {hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorText}>{errorMessage || 'Unable to load the page'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!!status && !hasError && (
        <View style={styles.overlay}>
          <View style={styles.toast}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.toastText} numberOfLines={2}>{status}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'rgba(15,15,15,0.95)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: '90%',
  },
  toastText: {
    color: '#ffffff',
    marginLeft: spacing.sm,
    ...typography.body2,
    fontWeight: '600',
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 2000,
  },
  errorCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.lg,
  },
  errorTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  retryButtonText: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.background.default,
  },
});
