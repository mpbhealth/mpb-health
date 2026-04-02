/**
 * Single long-lived WebView for HealthWallet. The stack screen can unmount when the user leaves,
 * but WKWebView clears sessionStorage when its instance is destroyed — which forces the vendor
 * login flow again. Parking one WebView off-screen preserves the session until sign-out.
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  Alert,
  BackHandler,
  Pressable,
  Linking,
  useWindowDimensions,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { Wallet, RefreshCw, ExternalLink } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { colors, typography, spacing } from '@/constants/theme';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { platformStyles, moderateScale, MIN_TOUCH_TARGET } from '@/utils/scaling';
import {
  HEALTH_WALLET_ENTRY_URL,
  healthWalletLastUrlStorageKey,
  isHealthWalletAuthGateUrl,
  isHealthWalletPartnerLandingUrl,
  shouldPersistHealthWalletResumeUrl,
  userHasHealthWalletProduct,
} from '@/utils/healthWallet';
import { useHealthWalletVisibility } from '@/contexts/HealthWalletVisibilityContext';

export function HealthWalletPortal() {
  const { routeFocused: active } = useHealthWalletVisibility();
  const router = useRouter();
  const { session } = useAuth();
  const { width: winW, height: winH } = useWindowDimensions();
  const { headerPaddingTop } = useSafeHeaderPadding();
  const { userData, loading } = useUserData();
  const webViewRef = useRef<WebView>(null);
  const currentUrlRef = useRef('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [entryUrl, setEntryUrl] = useState<string | null>(null);
  const [keeperMounted, setKeeperMounted] = useState(false);

  const eligible = userHasHealthWalletProduct(userData);
  const memberKey = userData?.member_id ?? userData?.id;

  /**
   * Parking at 1×1 with opacity 0 breaks many GPU compositor paths (especially Android hardware
   * layers). Keep a real layout off-screen at full opacity so the surface survives focus changes.
   */
  const parkedLayout = useMemo(() => {
    const w = Math.min(Math.max(winW, 320), 480);
    const h = Math.min(Math.max(winH * 0.92, 580), 960);
    return {
      width: w,
      height: h,
      left: -Math.ceil(winW) - 100,
    };
  }, [winW, winH]);

  /** Nudge layout after returning from a parked WebView — fixes white/blank frame on some devices. */
  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => {
      webViewRef.current?.injectJavaScript?.(
        "try{if(window.dispatchEvent){window.dispatchEvent(new Event('resize'));}}catch(e){}true;",
      );
    }, Platform.OS === 'android' ? 200 : 100);

    return () => clearTimeout(timer);
  }, [active]);

  /** Same class of GPU/WebView bug when resuming the app from the background while HealthWallet is open. */
  useEffect(() => {
    if (!active) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setTimeout(() => {
        webViewRef.current?.injectJavaScript?.(
          "try{if(window.dispatchEvent){window.dispatchEvent(new Event('resize'));}}catch(e){}true;",
        );
      }, 250);
    });

    return () => sub.remove();
  }, [active]);

  useEffect(() => {
    if (active && eligible && !loading) {
      setKeeperMounted(true);
    }
  }, [active, eligible, loading]);

  useEffect(() => {
    if (!session) {
      setKeeperMounted(false);
      setEntryUrl(null);
    }
  }, [session]);

  useEffect(() => {
    if (!keeperMounted) return;

    let cancelled = false;

    (async () => {
      if (!memberKey) {
        if (!cancelled) setEntryUrl(HEALTH_WALLET_ENTRY_URL);
        return;
      }

      try {
        const key = healthWalletLastUrlStorageKey(String(memberKey));
        const saved = await AsyncStorage.getItem(key);
        if (cancelled) return;
        if (saved && shouldPersistHealthWalletResumeUrl(saved)) {
          setEntryUrl(saved);
        } else {
          setEntryUrl(HEALTH_WALLET_ENTRY_URL);
        }
      } catch {
        if (!cancelled) setEntryUrl(HEALTH_WALLET_ENTRY_URL);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [keeperMounted, memberKey]);

  const handleNavigationStateChange = useCallback(
    (navState: { canGoBack?: boolean; url?: string }) => {
      const url = navState.url ?? '';
      currentUrlRef.current = url;
      setCurrentUrl(url);

      if (!memberKey || !url) return;

      const storageKey = healthWalletLastUrlStorageKey(String(memberKey));

      if (isHealthWalletAuthGateUrl(url)) {
        AsyncStorage.removeItem(storageKey).catch(() => {});
      } else if (shouldPersistHealthWalletResumeUrl(url)) {
        AsyncStorage.setItem(storageKey, url).catch(() => {});
      }
    },
    [memberKey],
  );

  const confirmExitHealthWallet = useCallback(() => {
    Alert.alert(
      'Exit HealthWallet',
      'Are you sure you want to exit HealthWallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }, [router]);

  /**
   * Partner hub (`landing-arm-mpb`): back asks before leaving the app shell.
   * Any other in-wallet page: snap to hub with `replace` so we never walk history into login/redirects.
   */
  const performHealthWalletBack = useCallback(() => {
    if (!webViewRef.current) {
      confirmExitHealthWallet();
      return;
    }

    const url = currentUrlRef.current;
    if (!url || isHealthWalletPartnerLandingUrl(url)) {
      confirmExitHealthWallet();
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.location.replace(${JSON.stringify(HEALTH_WALLET_ENTRY_URL)}); true;`,
    );
  }, [confirmExitHealthWallet]);

  const handleBackPress = useCallback(() => {
    performHealthWalletBack();
  }, [performHealthWalletBack]);

  const handleReload = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    webViewRef.current?.reload();
  }, []);

  const handleOpenInBrowser = useCallback(() => {
    const openUrl = currentUrl || entryUrl || HEALTH_WALLET_ENTRY_URL;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    WebBrowser.openBrowserAsync(openUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      enableBarCollapsing: true,
    }).catch(() => {
      Linking.openURL(openUrl).catch(() => {});
    });
  }, [currentUrl, entryUrl]);

  useEffect(() => {
    if (!active) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      performHealthWalletBack();
      return true;
    });

    return () => backHandler.remove();
  }, [active, performHealthWalletBack]);

  if (!keeperMounted || !eligible || entryUrl === null) {
    return null;
  }

  return (
    <View
      style={active ? styles.activeShell : [styles.parkedShell, parkedLayout]}
      pointerEvents={active ? 'auto' : 'none'}
      collapsable={false}
    >
      {active ? <StatusBar style="dark" /> : null}

      {active ? (
        <Animated.View
          style={[styles.header, { paddingTop: headerPaddingTop }]}
          entering={FadeInDown.delay(100)}
        >
          <BackButton onPress={handleBackPress} />
          <View style={styles.titleContainer}>
            <Wallet size={24} color={colors.primary.main} style={styles.titleIcon} />
            <Text style={styles.title} numberOfLines={1}>
              HealthWallet
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleReload}
              style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Reload HealthWallet"
              hitSlop={8}
            >
              <RefreshCw size={moderateScale(22)} color={colors.primary.main} />
            </Pressable>
            <Pressable
              onPress={handleOpenInBrowser}
              style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Open HealthWallet in browser"
              hitSlop={8}
            >
              <ExternalLink size={moderateScale(22)} color={colors.primary.main} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      <View style={active ? styles.webviewFlex : styles.webviewParked}>
        <WebViewContainer
          ref={webViewRef}
          url={entryUrl}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          highSecurity={false}
          enhancementPreset="portal"
          persistCookies
          cookieStorageKey="mpb_healthwallet_v1"
          enablePullToRefresh
          bridgeSafeAreaToPage
          keyboardDisplayRequiresUserAction={false}
          textZoom={100}
          scalesPageToFit={false}
          nestedScrollEnabled
          androidLayerType="hardware"
          enablePortalRobustness
          androidHandleHardwareBack={active}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeShell: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: Platform.OS === 'android' ? 50 : 0,
    backgroundColor: colors.background.default,
  },
  /** Off-screen shell; dimensions come from `parkedLayout` (avoid 1×1 + opacity-hiding blank bugs). */
  parkedShell: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  titleIcon: {
    marginRight: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  headerAction: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(10),
  },
  headerActionPressed: {
    backgroundColor: colors.gray[100],
  },
  webviewFlex: {
    flex: 1,
  },
  webviewParked: {
    width: 1,
    height: 1,
  },
});
